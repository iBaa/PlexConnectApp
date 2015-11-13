/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

String.prototype.tagsToHtmlEntities = function() {
  var tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  };
  return this.replace(/[&<>]/g, function(tag) {
                      return tagsToReplace[tag] || tag;
                      });
};



var photoPresenter = {

show: function(pmsId, pmsPath) {
  // get photo list
  var docString = swiftInterface.getViewIdPath('Photos', pmsId, pmsPath);  // error handling?
  
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  // render picture to screen
  photoUrl = doc.getTextContent('photo');
  doc = createPhoto(photoUrl.tagsToHtmlEntities());
  navigationDocument.pushDocument(doc);
},

slideshow: function(pmsId, pmsPath) {
  // get photo list
  var docString = swiftInterface.getViewIdPath('Photos', pmsId, pmsPath);  // error handling?
  
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  var playlist = doc.getElementByTagName("playlist")
  var photoDoc = undefined  // no photo on stack yet
  
  // start slideshow
  photoPresenter.showNext(playlist, photoDoc);
},

showNext: function(playlist, photoDoc) {
  // exit if not in control of the screen
  var doc = navigationDocument.documents[navigationDocument.documents.length-1];
  if (photoDoc && photoDoc != doc) {
    return
  }
  
  // next photo
  var photo = playlist.getElementByTagName("photo");
  // end slideshow, exit if no photo left
  if (photo==undefined) {
    navigationDocument.popDocument();
    return
  }
  
  // remove photo from playlist
  playlist.removeChild(photo);
  
  // render picture to screen
  var nextPhotoDoc = createPhoto(photo.textContent.tagsToHtmlEntities());
  if (!photoDoc) {
    // first photo
    navigationDocument.pushDocument(nextPhotoDoc);
  } else {
    // later photos - replace
    navigationDocument.replaceDocument(nextPhotoDoc, photoDoc);
  }

  // wait some time, request next one...
  setTimeout( function() { photoPresenter.showNext(playlist, nextPhotoDoc) }, 3000);  // todo: waiting period in settings
},
}



var createPhoto = function(photoUrl) {
  var docString = `<?xml version="1.0" encoding="UTF-8" ?>
  <document>
    <divTemplate>
      <fullscreenImg src="${photoUrl}" width="1920" height="1080" />
    </divTemplate>
  </document>`
    var parser = new DOMParser();
    var doc = parser.parseFromString(docString, "application/xml");
    return doc;
}
