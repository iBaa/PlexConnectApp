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
var isTranscoding = false;
var pingTimer = null;

// the player
var player = null;  // todo: treat all those variables more "locally" to videoPlayer?

/*
 https://developer.apple.com/library/prerelease/tvos/samplecode/TVMLAudioVideo/Listings/client_js_application_js.html#//apple_ref/doc/uid/TP40016506-client_js_application_js-DontLinkElementID_6
 */
var videoPlayer = {
  
play: function(pmsId, pmsPath) {
  // get video list
  var docString = swiftInterface.getViewIdPath('PlayVideo', pmsId, pmsPath);  // error handling?
  
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  // setup variables for transcoder ping
  pmsBaseUrl = doc.getTextContent('pmsBaseUrl');
  pmsToken = doc.getTextContent('pmsToken');
  
  lastReportedTime = -1;
  lastTranscoderPingTime = -1;
  
  // create playlist
  var playlist = new Playlist();
  
  var videos = doc.getElementsByTagName("video");
  for (var ix=0; ix<videos.length; ix++) {
    var video = videos.item(ix);  // why not [ix]?
    
    var mediaItem = new MediaItem("video");
    
    // player
    mediaItem.url = video.getTextContent('mediaUrl');
    mediaItem.title = video.getTextContent('title');
    mediaItem.subtitle = video.getTextContent('subtitle');
    mediaItem.type = video.getTextContent('genre');
    mediaItem.artworkImageURL = video.getTextContent('imageURL');
    mediaItem.description = video.getTextContent('description');
    // mediaItem.resumeTime = 0;

    // PMS
    mediaItem.key = video.getTextContent('key');
    mediaItem.ratingKey = video.getTextContent('ratingKey');
    mediaItem.duration = video.getTextContent('duration');
  
    playlist.push(mediaItem)
  }

  // read back key, ratingKey from first playlist entry
  mediaItem = playlist.item(0);
  if (!mediaItem) {
    // something went wrong - no media, no player...
    return
  }
  key = mediaItem.key
  ratingKey = mediaItem.ratingKey;
  duration = mediaItem.duration;
  isTranscoding = (mediaItem.url.indexOf('transcode/universal') > -1);

  // create video player
  player = new Player();
  player.playlist = playlist;
  
  player.addEventListener("timeDidChange", videoPlayer.onTimeDidChange, {"interval":5})
  player.addEventListener("stateDidChange", videoPlayer.onStateDidChange)
  player.addEventListener("mediaItemDidChange", videoPlayer.onMediaItemDidChange)
  
  // start player
  player.play();
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
  if (lastReportedTime == -1 || Math.abs(thisReportTime-lastReportedTime) > 5000)
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
      (lastTranscoderPingTime == -1 || Math.abs(thisReportTime-lastTranscoderPingTime) > 60000)
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
/*
    // correct thisReportTime with startTime if stacked media part
    thisReportTime += startTime;
*/
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
  var mediaItem = player.currentMediaItem;
  if (mediaItem) {
    key = mediaItem.key;
    ratingKey = mediaItem.ratingKey;
    duration = mediaItem.duration;
    isTranscoding = (mediaItem.url.indexOf('transcode/universal') > -1);
  }
  
  lastReportedTime = -1;
  lastTranscoderPingTime = -1;
},
}
