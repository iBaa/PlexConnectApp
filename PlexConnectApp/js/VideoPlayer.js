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
  
play: function(pmsId, pmsPath) {
  // get video list
  var docString = swiftInterface.getViewIdPath('PlayVideo', pmsId, pmsPath);  // error handling?
  
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  // setup variables for transcoder ping
  key = doc.getTextContent('key');
  ratingKey = doc.getTextContent('ratingKey');
  duration = doc.getTextContent('duration');
  pmsBaseUrl = doc.getTextContent('pmsBaseUrl');
  pmsToken = doc.getTextContent('pmsToken');
  
  lastReportedTime = -1;
  lastTranscoderPingTime = -1;
  isTranscoding = (doc.getTextContent('mediaUrl').indexOf('transcode/universal') > -1);
  
  // create video player
  // todo: playlist with mulitple items
  var player = new Player();
  var playlist = new Playlist();
  var mediaItem = new MediaItem("video", doc.getTextContent('mediaUrl'));

  mediaItem.title = doc.getTextContent('title');
  mediaItem.subtitle = doc.getTextContent('subtitle');
  mediaItem.type = doc.getTextContent('genre');
  mediaItem.artworkImageURL = doc.getTextContent('imageURL');
  mediaItem.description = doc.getTextContent('description');
  // mediaItem.resumeTime = 0;

  player.playlist = playlist;
  player.playlist.push(mediaItem);
  
  player.addEventListener("timeDidChange", videoPlayer.onTimeDidChange, {"interval":5})
  player.addEventListener("stateDidChange", videoPlayer.onStateDidChange)
  
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

}

