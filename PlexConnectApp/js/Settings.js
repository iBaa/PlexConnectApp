/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

var Settings = {
  
toggle: function(event) {
  var elem = event.target;
  
  // toggle setting
  var setting = elem.getAttribute("id");
  var docString = swiftInterface.toggleSettingView(setting, "Settings");
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  // update view
  var newElem = doc.getElementById(elem.getAttribute("id"));
  if (elem && newElem) {
    elem.innerHTML = newElem.innerHTML;
  }
},
}
