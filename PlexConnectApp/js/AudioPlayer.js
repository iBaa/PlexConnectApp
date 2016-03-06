/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

// metadata - communicated in PlayAudio
var key;
var ratingKey;
var duration;
var pmsBaseUrl;
var pmsToken;

// information for player - computed internally
var lastReportedTime;
var lastTranscoderPingTime;
var isTranscoding = false;
var pingTimer = null;



var audioPlayer = {
  
player: null,  // the player

play: function(pmsId, pmsPath) {
  // parse optional argument: "startAt",ix; "shuffle"
  var startAt = 0;
  var shuffle = false;
  if(arguments[2]=="startAt") {
    startAt = arguments[3];
  } else if (arguments[2]=="shuffle") {
    shuffle = true;
  }
  
  // get track list
  var docString = swiftInterface.getViewIdPath('PlayAudio', pmsId, pmsPath);  // error handling?
  
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  // setup variables for transcoder ping
  pmsBaseUrl = doc.getTextContent('pmsBaseUrl');
  pmsToken = doc.getTextContent('pmsToken');
  
  lastReportedTime = 0;
  lastTranscoderPingTime = 0;
  
  // create playlist
  var playlist = new Playlist();
  
  var tracks = doc.getElementsByTagName("track");
  
  // startAt/shuffle: create array of tracks to play
  var arr = range(startAt,tracks.length-1);
  if (shuffle) {
    arr = shuffleArray(arr);
  }

  for (var ix in arr) {
    var track = tracks.item(arr[ix]);  // why not [arr[ix]]?
    
    var mediaItem = new MediaItem("audio");
    
    // player
    mediaItem.url = track.getTextContent('mediaUrl');
    mediaItem.title = track.getTextContent('title');
    mediaItem.subtitle = track.getTextContent('subtitle');
    mediaItem.artworkImageURL = track.getTextContent('imageURL');
    mediaItem.description = track.getTextContent('description');
    // mediaItem.resumeTime = 0;
    
    // PMS
    mediaItem.key = track.getTextContent('key');
    mediaItem.ratingKey = track.getTextContent('ratingKey');
    mediaItem.duration = track.getTextContent('duration');
    
    playlist.push(mediaItem)
  }

  // read back key, ratingKey from first playlist entry
  mediaItem = playlist.item(0);
  if (!mediaItem) {
    // something went wrong - no media, no player...
    var doc = createAlert("Audio Player", "No media found.");
    navigationDocument.pushDocument(doc);
    return
  }
  key = mediaItem.key
  ratingKey = mediaItem.ratingKey;
  duration = mediaItem.duration;
  isTranscoding = (mediaItem.url.indexOf('transcode/universal') > -1);

  // create audio player
  var player = new Player();
  player.playlist = playlist;
  
  player.addEventListener("timeDidChange", audioPlayer.onTimeDidChange, {"interval":5})
  player.addEventListener("stateDidChange", audioPlayer.onStateDidChange)
  player.addEventListener("mediaItemDidChange", audioPlayer.onMediaItemDidChange)
  
  // start player
  player.present();  // todo: bug? why do we need present, then play? will stay at "paused" otherwise.
  player.play();
  
  audioPlayer.player = player;
},

nowPlaying: function() {
  if(audioPlayer.player) {
    audioPlayer.player.present();  // todo: disable button if player unavailbale
  }
},
  
onTimeDidChange: function(timeObj) {
  console.log("onTimeDidChange: " + timeObj.time + "s");
  
  //remainingTime = Math.round((duration / 1000) - time);
  var thisReportTime = Math.round(timeObj.time*1000)
  /*
  // correct thisReportTime with startTime if stacked media part
  thisReportTime += startTime;
  */
  // report watched time
  if (Math.abs(thisReportTime-lastReportedTime) > 5000)
  {
    lastReportedTime = thisReportTime;
    var url = pmsBaseUrl + '/:/timeline?ratingKey=' + ratingKey +
              '&key=' + key +
              '&duration=' + duration.toString() +
              '&state=playing' +
              '&time=' + thisReportTime.toString() +
              '&X-Plex-Client-Identifier=' + encodeURIComponent(Device.vendorIdentifier) +
              '&X-Plex-Device-Name=' + encodeURIComponent(Device.model);
    if (pmsToken!='')
      url = url + '&X-Plex-Token=' + pmsToken;
    loadPage(url);
  }

  // ping transcoder to keep it alive
  if (isTranscoding &&
      (Math.abs(thisReportTime-lastTranscoderPingTime) > 60000)
      )
  {
    lastTranscoderPingTime = thisReportTime;
    var url = pmsBaseUrl + '/music/:/transcode/universal/ping?session=' + ratingKey;
    if (pmsToken!='')
      url = url + '&X-Plex-Token=' + pmsToken;
    loadPage(url);
  }
},
  
onStateDidChange: function(stateObj) {
  console.log("onStateDidChange: "+stateObj.oldState+" to "+stateObj.state);

  // states: begin, loading, paused, playing, end
  newState = stateObj.state;
  pmsState = null;
  
  if (newState == 'loading')  // loading state, tell PMS we're buffering
  {
    pmsState = 'buffering';
  }
  else if (newState == 'paused')  // pause state, ping transcoder to keep session alive
  {
    pmsState = 'paused';
    if (isTranscoding)
    {
      pingTimer = setInterval(
        function() {
                    var url = pmsBaseUrl + '/music/:/transcode/universal/ping?session=' + ratingKey;
                    if (pmsToken!='')
                      url = url + '&X-Plex-Token=' + pmsToken;
                    loadPage(url);
                    }, 60000
      );
    }
  }
  else if (newState == 'playing')  // playing state, kill paused state ping timer
  {
    pmsState = 'play'
    if (isTranscoding)
    {
      clearInterval(pingTimer);
    }
  }
  else if (newState == 'end')  // state "end", shut down transcoder session
  {
    pmsState = 'stopped'
    if (isTranscoding)
    {
      var url = pmsBaseUrl + '/music/:/transcode/universal/stop?session=' + ratingKey;
      if (pmsToken!='')
        url = url + '&X-Plex-Token=' + pmsToken;
      loadPage(url);
    }
    //player = null  // free player to get cleaned up  // don't. when starting a new track, player will be started, then old one removed.
  }
  
  if (pmsState != null) {
    var url = pmsBaseUrl + '/:/timeline?ratingKey=' + ratingKey +
              '&key=' + key +
              '&state=' + pmsState +
              '&duration=' + duration.toString() +
              '&time=' + lastReportedTime.toString() +
              '&report=1' +
              '&X-Plex-Client-Identifier=' + encodeURIComponent(Device.vendorIdentifier) +
              '&X-Plex-Device-Name=' + encodeURIComponent(Device.model);
    if (pmsToken!='')
      url = url + '&X-Plex-Token=' + pmsToken;
    loadPage(url);
  }
},

onMediaItemDidChange: function(event) {
  console.log("onMediaItemDidChange "+event.reason);
  // event.reason: 0-Unknown, 1-Played to end, 2-Forwarded to end, 3-Errored, 4-Playlist changed, 5-User initiated
  
  // media information
  var player = audioPlayer.player;
  if (player && player.currentMediaItem) {
    var mediaItem = player.currentMediaItem;

    key = mediaItem.key;
    ratingKey = mediaItem.ratingKey;
    duration = mediaItem.duration;
    isTranscoding = (mediaItem.url.indexOf('transcode/universal') > -1);
      
    lastReportedTime = 0;
    lastTranscoderPingTime = 0;
  }
},
}
