/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

/*
 Example code from Apple:
 https://developer.apple.com/library/prerelease/tvos/documentation/General/Conceptual/AppleTV_PG/YourFirstAppleTVApp.html
 */


var myURL;


App.onLaunch = function(options) {
  
  var javascriptFiles = [
    `${options.BASEURL}/js/Utilities.js`,
    `${options.BASEURL}/js/Presenter.js`,
    `${options.BASEURL}/js/VideoPlayer.js`,
    `${options.BASEURL}/js/AudioPlayer.js`,
    `${options.BASEURL}/js/PhotoPresenter.js`,
    `${options.BASEURL}/js/Settings.js`,
    `${options.BASEURL}/js/MyPlex.js`,
    `${options.BASEURL}/js/Search.js`
  ];
  
  evaluateScripts(javascriptFiles, function(success) {
    if(success) {
      console.log(options);
      myURL = options["BASEURL"]
      var templateURL = myURL+'/MenuBar.xml';  // template/
      loadDocument(templateURL, Presenter.pushDocument);
    } else {
      var errorDoc = createAlert("Evaluate Scripts Error", "Error attempting to evaluate external JavaScript files.");
      navigationDocument.presentModal(errorDoc);
    }
  });
}

App.onExit = function() {
    console.log('App finished');
}


var createAlert = function(title, description) {
  var alertString = `<?xml version="1.0" encoding="UTF-8" ?>
  <document>
    <alertTemplate>
      <title>${title}</title>
      <description>${description}</description>
    </alertTemplate>
  </document>`
  var parser = new DOMParser();
  var alertDoc = parser.parseFromString(alertString, "application/xml");
  return alertDoc;
}