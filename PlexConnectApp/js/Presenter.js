/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

/*
 Example code from Ray Wenderlich:
 http://www.raywenderlich.com/114886/beginning-tvos-development-with-tvml-tutorial
 */


var Presenter = {
  
makeDocument: function(resource) {
  if (!Presenter.parser) {
    Presenter.parser = new DOMParser();
  }
  var doc = Presenter.parser.parseFromString(resource, "application/xml");
  return doc;
},

modalDialogPresenter: function(xml) {
  navigationDocument.presentModal(xml);
},
  
pushDocument: function(xml) {
  xml.addEventListener("select", Presenter.onSelect.bind(Presenter));
  xml.addEventListener("play", Presenter.onPlay.bind(Presenter));
  //xml.addEventListener("highlight", Presenter.onHighlight.bind(Presenter));
  xml.addEventListener("load", Presenter.onLoad.bind(Presenter));  // setup search for char entered
  navigationDocument.pushDocument(xml);
},
  
// event handler: onSelect
onSelect: function(event) {
  console.log(event);
  var elem = event.target;
  
  var id = elem.getAttribute("id");
  var presenter = elem.getAttribute("onSelectPresenter");
  if (!presenter) {
    presenter = elem.getAttribute("presenter");  // default to plain presenter tag
  }
  
  if (presenter=="select") {
    var url = elem.getAttribute("onSelectURL");
    if (!url) {
      url = elem.getAttribute("URL");  // default to plain presenter tag
    }
    console.log(url);
    loadXML(url);
  } else if (presenter=="video") {
    var videoURL = elem.getAttribute("onSelectURL");
    videoPlayer.play(videoURL);
  } else if (presenter=="audio") {
      var audioURL = elem.getAttribute("onSelectURL");
      audioPlayer.play(audioURL);
  } else if (presenter=="menuBar"){
    // menuBar
    var feature = elem.parentNode.getFeature("MenuBarDocument");
    var menuContent = elem.getAttribute("menuContent");
    if (feature && menuContent) {
      var currentDoc = feature.getDocument(elem);
        if (!currentDoc  // todo: better algorithm to decide on doc reload
          || (id!="Search" && id!="Settings")) {  // currently: force reload on each but Settings, Search
                     loadDocument(menuContent,function(doc) {
                     doc.addEventListener("select", Presenter.onSelect.bind(Presenter));
                     doc.addEventListener("load", Presenter.onLoad.bind(Presenter));  // setup search for char entered
                     feature.setDocument(doc, elem);
                     });
      }
    }
  } else {
    if (elem) {
      //var onSelect = elem.getAttribute("onSelect");  // get onSelect=...
      with (event) {
        eval(presenter);
      }
    }
  }
},
  
onPlay: function(event) {
  console.log(event);
  var elem = event.target;
//
  Presenter.onSelect(event);
//
},
  
// grab keyboard changes for searchField
onLoad: function(event) {
  var elem = event.target;

  if (elem) {
    var onLoad = elem.getAttribute("onLoad");  // get onLoad=...
    with (event) {
      eval(onLoad);
    }
  }
},

}
