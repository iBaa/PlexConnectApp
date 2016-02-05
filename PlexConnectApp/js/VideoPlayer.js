/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

// metadata - communicated in PlayVideo
var key;
var ratingKey;
var duration;
var pmsBaseUrl;
var pmsToken;

// information for player - computed internally
var lastReportedTime;
var lastTranscoderPingTime;
var partStartTime;  // ms - starting time of stacked media part
var isTranscoding = false;
var pingTimer = null;



/*
 https://developer.apple.com/library/prerelease/tvos/samplecode/TVMLAudioVideo/Listings/client_js_application_js.html#//apple_ref/doc/uid/TP40016506-client_js_application_js-DontLinkElementID_6
 */
var videoPlayer = {
    
player: null,  // the player
  
play: function(pmsId, pmsPath) {
  // parse optional argument: "resume"; "startAt",ix; "shuffle"
  var resume = false;
  var startAt = 0;
  var shuffle = false;
  if (arguments[2]=="resume") {
    resume = true;
  } else if(arguments[2]=="startAt") {
    startAt = arguments[3];
  } else if (arguments[2]=="shuffle") {
    shuffle = true;
  }
  
  // get video list
  var docString = swiftInterface.getViewIdPath('PlayVideo', pmsId, pmsPath);  // error handling?
  
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  // setup variables for transcoder ping
  pmsBaseUrl = doc.getTextContent('pmsBaseUrl');
  pmsToken = doc.getTextContent('pmsToken');
  
  lastReportedTime = 0;
  lastTranscoderPingTime = 0;
  
  // create playlist
  var playlist = new Playlist();
  
  var videos = doc.getElementsByTagName("video");
  
  // startAt/shuffle: create array of tracks to play
  var arr = range(startAt,videos.length-1);
  if (shuffle) {
    arr = shuffleArray(arr);
  }
    
  for (var ix in arr) {
    var video = videos.item(arr[ix]);  // why not [arr[ix]]?
    
    var _partStartTime = 0;
    var parts = video.getElementsByTagName('part');
    for (var partIx=0; partIx<parts.length; partIx++) {
      var part = parts.item(partIx);
      
      var mediaItem = new MediaItem('video');
    
      // player
      mediaItem.url = part.getTextContent('mediaUrl');
      mediaItem.partIx = partIx
      mediaItem.indirect = part.getTextContent('indirect');
    
      mediaItem.title = video.getTextContent('title');
      mediaItem.subtitle = video.getTextContent('subtitle');  // todo: check subtitle for stacked video
      mediaItem.artworkImageURL = video.getTextContent('imageURL');
      mediaItem.description = video.getTextContent('description');

      // PMS
      mediaItem.key = video.getTextContent('key');
      mediaItem.ratingKey = video.getTextContent('ratingKey');
      mediaItem.duration = parseInt(video.getTextContent('duration'));
      mediaItem.partDuration = parseInt(part.getTextContent('mediaDuration'));
      
      mediaItem.partStartTime = _partStartTime;
      _partStartTime += mediaItem.partDuration;  // stacked media: startTime = sum of previous durations
  
      playlist.push(mediaItem)
    }
  }
  
  // "resume" into consecutive stacked video
  var resumeTime = 0;
  if (resume) {
    var video = doc.getElementByTagName('video');
    resumeTime = parseInt(video.getTextContent('resumeTime'));  // in ms
    
    // skip over already watched parts
    mediaItem = playlist.item(0);
    while (resumeTime > mediaItem.partDuration) {
      playlist.splice(0, 1);  // remove first playlist element
      resumeTime -= mediaItem.partDuration;
      mediaItem = playlist.item(0);  // check next
      if (!mediaItem) {
        // no media left? - no media, no player...
        var doc = createAlert("Video Player", "Resume over end of video.");
        navigationDocument.pushDocument(doc);
        return
      }
    }
  }
  
  // read back key, ratingKey from first playlist entry
  mediaItem = playlist.item(0);
  if (!mediaItem) {
    // something went wrong - no media, no player...
    var doc = createAlert("Video Player", "No media found.");
    navigationDocument.pushDocument(doc);
    return
  }
  key = mediaItem.key
  ratingKey = mediaItem.ratingKey;
  duration = mediaItem.duration;
  partStartTime = mediaItem.partStartTime;
  isTranscoding = (mediaItem.url.indexOf('transcode/universal') > -1);
  
  // indirect url - redirect upper 3 video urls
  for (var ix=0; ix<3 && ix<playlist.length; ix++) {
    videoPlayer.handleIndirectUrl(playlist.item(ix));  // todo: redirect ix=1,2 asyncronous? would save some video startup time.
  }
  
  // create video player
  var player = new Player();
  player.playlist = playlist;
  
  player.addEventListener("timeDidChange", videoPlayer.onTimeDidChange, {"interval":5});
  player.addEventListener("stateWillChange", videoPlayer.onStateWillChange);
  player.addEventListener("stateDidChange", videoPlayer.onStateDidChange);
  player.addEventListener("mediaItemDidChange", videoPlayer.onMediaItemDidChange);
  
  // start player
  player.seekToTime(resumeTime/1000);
  player.play();
  
  videoPlayer.player = player;
},

handleIndirectUrl: function(mediaItem) {
  if (mediaItem && mediaItem.indirect=="1") {
    // get redirected url from playlist based on fresh PMS XML
    var docString = swiftInterface.getViewIdPath('PlayVideo', '', mediaItem.url);  // pmsId not needed, full url  // error handling?
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(docString, "application/xml");
    
    // upadate url from playlist/video/part[ix]/mediaUrl
    var parts = doc.getElementsByTagName('part');
    var part = parts.item(mediaItem.partIx);
    mediaItem.url = part.getTextContent('mediaUrl');
    mediaItem.indirect = part.getTextContent('indirect');  // redirected once... should be "0" now
  }
},
  
onTimeDidChange: function(timeObj) {
  console.log("onTimeDidChange: " + timeObj.time + "s");
  
  //remainingTime = Math.round((duration / 1000) - time);
  var thisReportTime = Math.round(timeObj.time*1000)
  // correct thisReportTime with startTime of stacked media part
  thisReportTime += partStartTime;
  
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
    var url = pmsBaseUrl + '/video/:/transcode/universal/ping?session=' + ratingKey;
    if (pmsToken!='')
      url = url + '&X-Plex-Token=' + pmsToken;
    loadPage(url);
  }

  /*
  if (subtitle)
    updateSubtitle(thisReportTime);
  */
},

onStateWillChange: function(stateObj) {
  console.log("onStateWillChange: "+stateObj.oldState+" to "+stateObj.state);
 
  // states: begin, scanning, loading, paused, playing, end
  newState = stateObj.state;
  
  if (newState == 'end') {  // approaching state "end"
    // modify PrePlay Screen - resume button
    var doc = navigationDocument.documents[navigationDocument.documents.length-1];
    var elem = doc.getElementById("resume");

    var resumeThreshold = 60000;  // 1min in ms  // check with PMS time thresholds
    var finishThreshold = duration-60000;  // 1min in ms before the end

    if (elem) {
      if (elem.hasAttribute("disabled") &&
          lastReportedTime >= resumeThreshold &&
          lastReportedTime < finishThreshold) {  // enable resume button to have it handy after menu-ing out

        var newElem = elem.cloneNode(true);
        newElem.removeAttribute("disabled");
        elem.outerHTML = newElem.outerHTML;
      }
      else if (!elem.hasAttribute("disabled") &&
          lastReportedTime >= finishThreshold) {  // disable resume button - video is done completely

        var newElem = elem.cloneNode(true);
        newElem.setAttribute("disabled", "true");
        elem.outerHTML = newElem.outerHTML;
      }
    }
  }
},

onStateDidChange: function(stateObj) {
  console.log("onStateDidChange: "+stateObj.oldState+" to "+stateObj.state);

  // states: begin, scanning, loading, paused, playing, end
  newState = stateObj.state;
  pmsState = null;
  
  if (newState == 'loading')  // loading state, tell PMS we're buffering
  {
    pmsState = 'buffering';
  }
  else if (newState == 'scanning') {  // scanning state - RW or FF, +/-10sec
    
  }
  else if (newState == 'paused')  // pause state, ping transcoder to keep session alive
  {
    pmsState = 'paused';
    if (isTranscoding)
    {
      pingTimer = setInterval(
        function() {
                    var url = pmsBaseUrl + '/video/:/transcode/universal/ping?session=' + ratingKey;
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
      var url = pmsBaseUrl + '/video/:/transcode/universal/stop?session=' + ratingKey;
      if (pmsToken!='')
        url = url + '&X-Plex-Token=' + pmsToken;
      loadPage(url);
    }
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
  var player = videoPlayer.player;
  if (player && player.currentMediaItem) {
    var mediaItem = player.currentMediaItem;

    key = mediaItem.key;
    ratingKey = mediaItem.ratingKey;
    duration = mediaItem.duration;
    partStartTime = mediaItem.partStartTime;
    isTranscoding = (mediaItem.url.indexOf('transcode/universal') > -1);

    lastReportedTime = partStartTime;  // reset timer only if other mediaItem follows to stay in sync with key/ratingKey
    lastTranscoderPingTime = partStartTime;
  }
  
  // indirect url - redirect 3rd one down
  var playlist = player.playlist;
  for (var ix=0; ix<playlist.length-2; ix++) {
    if (playlist.item(ix)==player.currentMediaItem) {
      var mediaItem = playlist.item(ix+2);  // redirect but-next, upper 3 urls already redirected in play()
      videoPlayer.handleIndirectUrl(mediaItem);
      break;
    }
  }
},
}
