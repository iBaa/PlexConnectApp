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

show: function(url) {
  loadDocument(url, this.gotPhotoXML);
},

gotPhotoXML: function(doc) {
  photoUrl = doc.getTextContent('photo');
  doc = createPhoto(photoUrl.tagsToHtmlEntities());
  navigationDocument.pushDocument(doc);
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
