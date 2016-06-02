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

/*
  call swift.XMLConverter with...
    template: view
    pmsId: id
    pmsPath: path
 */
setupViewDocument: function(view, pmsId, pmsPath) {
  console.log("load");
  
  var docString = swiftInterface.getViewIdPath(view, pmsId, pmsPath);
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");
  
  // events: https://developer.apple.com/library/tvos/documentation/TVMLKit/Reference/TVViewElement_Ref/index.html#//apple_ref/c/tdef/TVElementEventType
  doc.addEventListener("select", Presenter.onSelect.bind(Presenter));
  doc.addEventListener("holdselect", Presenter.onHoldSelect.bind(Presenter));
  doc.addEventListener("play", Presenter.onPlay.bind(Presenter));
  doc.addEventListener("highlight", Presenter.onHighlight.bind(Presenter));
  doc.addEventListener("load", Presenter.onLoad.bind(Presenter));  // setup search for char entered
    // store address in DOM - eg for later page refresh
    doc.source = {
        view: view,
        pmsId: pmsId,
        pmsPath: pmsPath,
    };
    
  return doc
},

load: function(view, pmsId, pmsPath) {
  var loadingDoc = createSpinner("Loading...");
  loadingDoc.addEventListener("load", function() {
      var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
        navigationDocument.replaceDocument(doc, loadingDoc);
  });
  navigationDocument.pushDocument(loadingDoc);
  //navigationDocument.dismissModal();  // just in case?!  // todo: if (isModal)...?
 
    
},
    
loadView: function(view, pmsId, pmsPath) {
    var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
    navigationDocument.pushDocument(doc);
    
    
},
    
loadArt: function(view, pmsId, pmsPath, artwork, title) {
        var loadingDoc = createArtSpinner(title, artwork);
    loadingDoc.addEventListener("load", function() {
                                var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
                                navigationDocument.replaceDocument(doc, loadingDoc);
                                });
    navigationDocument.pushDocument(loadingDoc);
    //navigationDocument.dismissModal();  // just in case?!  // todo: if (isModal)...?
    
    
},
    
    
loadPopup: function(view, pmsId, pmsPath) {
    var currentDoc = navigationDocument.documents[navigationDocument.documents.length-1];
    
    var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
    navigationDocument.replaceDocument(doc, currentDoc);
    navigationDocument.dismissModal();
    
},

loadAndSwap: function(view, pmsId, pmsPath) {
  var currentDoc = navigationDocument.documents[navigationDocument.documents.length-1];
  var loadingDoc = createSpinner("");
  loadingDoc.addEventListener("load", function() {
      var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
      navigationDocument.replaceDocument(doc, loadingDoc);
  });
  navigationDocument.replaceDocument(loadingDoc, currentDoc);
  // navigationDocument.dismissModal();  // just in case?!  // todo: if (isModal)...?
},
    


close() {
  navigationDocument.popDocument();
},
  
loadContext(view, pmsId, pmsPath) {
  var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
  navigationDocument.presentModal(doc);
},
    
closeContext() {
  navigationDocument.dismissModal();
},
  
loadMenuContent: function(view, pmsId, pmsPath) {
  console.log("loadMenuContent");
  var elem = this.event.target;  // todo: check event existing
  var id = elem.getAttribute("id");
  
  var feature = elem.parentNode.getFeature("MenuBarDocument");
  if (feature) {
    var currentDoc = feature.getDocument(elem);
    if (!currentDoc  // todo: better algorithm to decide on doc reload
        || (id!="Search" && id!="Settings")) {  // currently: force reload on each but Settings, Search

      var loadingDoc = createSpinner("");
      feature.setDocument(loadingDoc, elem);
      var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
      feature.setDocument(doc, elem);
    }
  }
},

loadParade: function(view, pmsId, pmsPath) {
  console.log("loadParade");
  var elem = this.event.target;
  if (!elem) {  // no element?
    return;
  }
  var elem = elem.getElementByTagName("relatedContent");
  if (elem.hasChildNodes()) {  // related content already populated?
    return;
  }
  
  // update view
  var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
  var elemNew = doc.getElementByTagName("relatedContent");
  
  if (elem && elemNew) {
    elem.innerHTML = elemNew.innerHTML;
  }
},
  
// store event for downstream use
event: "",

/*
 event handlers
 */
onSelect: function(event) {
  console.log("onSelect "+event);
  this.event = event;
  var elem = event.target;

  if (elem) {
    var id = elem.getAttribute("id");
    var onSelect = elem.getAttribute("onSelect");  // get onSelect=...
    with (event) {
      eval(onSelect);
    }
  }
},
  
onHoldSelect: function(event) {
  console.log("onHoldSelect "+event);
  this.event = event;
  var elem = event.target;
  
  if (elem) {
    var id = elem.getAttribute("id");
    var onHoldSelect = elem.getAttribute("onHoldSelect");  // get onHoldSelect=...
    if (!onHoldSelect) {
      onHoldSelect = elem.getAttribute("onSelect");  // fall back to onSelect=...
    }
    with (event) {
      eval(onHoldSelect);
    }
  }
},
  
onPlay: function(event) {
  console.log("onPlay "+event);
  this.event = event;
  var elem = event.target;

  if (elem) {
    var id = elem.getAttribute("id");
    var onPlay = elem.getAttribute("onPlay");  // get onPlay=...
    if (!onPlay) {
      onPlay = elem.getAttribute("onSelect");  // fall back to onSelect=...
    }
    with (event) {
      eval(onPlay);
    }
  }

},

onHighlight: function(event) {
  console.log("onHighlight "+event);
  this.event = event;
  var elem = event.target;
  
  if (elem) {
    var onHighlight = elem.getAttribute("onHighlight");  // get onHighlight=...
    if (onHighlight) {
      eval(onHighlight);
    }
  }
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
