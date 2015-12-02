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



/*
 https://developer.apple.com/library/prerelease/tvos/samplecode/TVMLAudioVideo/Listings/client_js_application_js.html#//apple_ref/doc/uid/TP40016506-client_js_application_js-DontLinkElementID_6
 */
var videoPlayer = {
    
player: null,  // the player
  
play: function(pmsId, pmsPath, resume) {
  // resume: optional value - string "resume" to start first video at "resumeTime"
  
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
    mediaItem.artworkImageURL = video.getTextContent('imageURL');
    mediaItem.description = video.getTextContent('description');

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
  var player = new Player();
  player.playlist = playlist;
  
  player.addEventListener("timeDidChange", videoPlayer.onTimeDidChange, {"interval":5});
  player.addEventListener("stateWillChange", videoPlayer.onStateWillChange);
  player.addEventListener("stateDidChange", videoPlayer.onStateDidChange);
  player.addEventListener("mediaItemDidChange", videoPlayer.onMediaItemDidChange);
  
  // "resume" first video
  if (resume=="resume") {
    var video = doc.getElementByTagName("video");
    var resumeTime = video.getTextContent('resumeTime');  // in ms
    
    player.seekToTime(resumeTime/1000)  // todo: stacked media - roll resumeTime into next part
  }

  // start player
  player.play();
  
  videoPlayer.player = player;
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
  var player = videoPlayer.player;
  if (player && player.currentMediaItem) {
    var mediaItem = player.currentMediaItem;

    key = mediaItem.key;
    ratingKey = mediaItem.ratingKey;
    duration = mediaItem.duration;
    isTranscoding = (mediaItem.url.indexOf('transcode/universal') > -1);
  }
  
  lastReportedTime = -1;
  lastTranscoderPingTime = -1;
},
}
