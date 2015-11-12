/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

var Search = {

requestAndUpdateSearch: function() {
  // get searchField
  var doc = navigationDocument.documents[navigationDocument.documents.length-1];
  var searchField = doc.getElementByTagName("searchField");
  var searchResults = doc.getElementById("searchResults");
  if (!searchField) {
    // try menuBar.menuContent
    var elem = doc.getElementById("Search");
    var feature = elem.parentNode.getFeature("MenuBarDocument");
    doc = feature.getDocument(elem);  // todo: check for feature existing?
    searchField = doc.getElementByTagName("searchField");
    searchResults = doc.getElementById("searchResults");
  }
  // get data from searchfield
  var query = searchField.getFeature("Keyboard").text;  // get the keyboard element, entered query string
  
  // query and get search results
  var url = searchField.getAttribute("url");
  var view = searchField.getAttribute("view");
  var pmsId = searchField.getAttribute("pmsId");
  var pmsPath = searchField.getAttribute("pmsPath").format(encodeURIComponent(query));
  
  var docString = swiftInterface.getViewIdPath(view, pmsId, pmsPath);
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");

  // update view
  var newResults = doc.getElementById('searchResults');
  if (newResults && newResults.childElementCount>0) {  // todo: check results, too?
    searchResults.innerHTML = newResults.innerHTML;
  } else {
    while (searchResults.firstChild) {
      searchResults.removeChild(searchResults.firstChild);
    }
  }
},
  
onLoad: function(event) {
  console.log("Search.onLoad");
  var elem = event.target;
  
  // find searchField
  var searchField = elem.getElementByTagName("searchField");
  if (!searchField) {
    return;
  }
  
  // setup event onTextChange
  var keyboard = searchField.getFeature("Keyboard"); // get the textField's Keyboard element
  keyboard.onTextChange = function () {
    console.log("onTextChange "+keyboard.text)
    Search.requestAndUpdateSearch()
  }
},
}


