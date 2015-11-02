/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

var Settings = {
  
toggle: function(event) {
  var elem = event.target;
  
  // toggle setting
  var url = myURL +
            "/Settings.xml" +  // todo: link to current settings page
            "?X-PMS-Command=ToggleSetting&X-PMS-Setting="+elem.getAttribute("id");
  loadDocument(url, function(doc) { Settings.updateView(doc, elem); });
},

updateView: function(doc, elem) {
  // update view
  var newElem = doc.getElementById(elem.getAttribute("id"));
  if (elem && newElem) {
    elem.innerHTML = newElem.innerHTML;
  }
},
}
