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
  if (!parser) {
    var parser = new DOMParser();
  }
  // var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");
  
  // events: https://developer.apple.com/library/tvos/documentation/TVMLKit/Reference/TVViewElement_Ref/index.html#//apple_ref/c/tdef/TVElementEventType
  doc.addEventListener("select", Presenter.onSelect.bind(Presenter));
  doc.addEventListener("holdselect", Presenter.onHoldSelect.bind(Presenter));
  doc.addEventListener("play", Presenter.onPlay.bind(Presenter));
  doc.addEventListener("highlight", Presenter.onHighlight.bind(Presenter));
  doc.addEventListener("load", Presenter.onLoad.bind(Presenter));  // setup search for char entered
  // doc.addEventListener("unload", Presenter.onUnload.bind(Presenter));  // setup search for char entered
  // doc.addEventListener("appear", Presenter.onAppear.bind(Presenter));  // setup search for char entered
  // doc.addEventListener("disappear", Presenter.onDisappear.bind(Presenter));  // setup search for char entered
  // doc.addEventListener("update", Presenter.onUpdate.bind(Presenter));  // setup search for char entered
  // doc.addEventListener("didupdate", Presenter.onDidupdate.bind(Presenter));  // setup search for char entered
  
  return doc
},

refreshDocument: function(view, pmsId, pmsPath) {
  console.log("setting up refresh doc");
  var previousDoc = navigationDocument.documents[navigationDocument.documents.length-2];
  //console.log('===== currentDoc: ' + view + ' currentPMS: ' + pmsId + ' currentPath: ' + pmsPath);
  console.log("setting up refresh doc");
  
  var docString = "<document><alertTemplate onLoad=\"Presenter.loadAndSwap('"+ref_view+"','"+pmsId+"','"+ref_pmsPath+"');\"></alertTemplate></document>";
  if (!parser) {
    var parser = new DOMParser();
  }
  var doc = parser.parseFromString(docString, "application/xml");
  
  doc.addEventListener("select", Presenter.onSelect.bind(Presenter));
  doc.addEventListener("holdselect", Presenter.onHoldSelect.bind(Presenter));
  doc.addEventListener("play", Presenter.onPlay.bind(Presenter));
  doc.addEventListener("highlight", Presenter.onHighlight.bind(Presenter));
  doc.addEventListener("load", Presenter.onLoad.bind(Presenter));  // setup search for char entered
  navigationDocument.replaceDocument(doc, previousDoc);
},
  
load: function(view, pmsId, pmsPath) {
  var loadingDoc = createSpinner("");
  loadingDoc.addEventListener("load", function() {
      var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
      navigationDocument.replaceDocument(doc, loadingDoc);
      console.log('Doc loaded: ' + view);
  });
  navigationDocument.pushDocument(loadingDoc);
},
  
loadAndSwap: function(view, pmsId, pmsPath) {
  var currentDoc = navigationDocument.documents[navigationDocument.documents.length-1];
  var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
  navigationDocument.replaceDocument(doc, currentDoc);
},
  
/*
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
*/
 
loadAndReload: function(view, pmsId, pmsPath, ref_view, ref_pmsPath) {
  var loadingDoc = createSpinner("");
  loadingDoc.addEventListener("load", function() {
      var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
      navigationDocument.replaceDocument(doc, loadingDoc);
      console.log('Doc loaded: ' + view);
      });
  navigationDocument.pushDocument(loadingDoc);
  var previousDoc = navigationDocument.documents[navigationDocument.documents.length-2];
  //console.log('===== currentDoc: ' + view + ' currentPMS: ' + pmsId + ' currentPath: ' + pmsPath);
  console.log("setting up refresh doc");
  
  var docString = "<document><alertTemplate onLoad=\"Presenter.loadAndSwap('"+ref_view+"','"+pmsId+"','"+ref_pmsPath+"');\"></alertTemplate></document>";
  if (!parser) {
    var parser = new DOMParser();
  }
  var doc = parser.parseFromString(docString, "application/xml");
  
  doc.addEventListener("select", Presenter.onSelect.bind(Presenter));
  doc.addEventListener("holdselect", Presenter.onHoldSelect.bind(Presenter));
  doc.addEventListener("play", Presenter.onPlay.bind(Presenter));
  doc.addEventListener("highlight", Presenter.onHighlight.bind(Presenter));
  doc.addEventListener("load", Presenter.onLoad.bind(Presenter));  // setup search for char entered
  navigationDocument.replaceDocument(doc, previousDoc);
 
},

  
loadAndSwap2: function(view, pmsId, pmsPath) {
  var currentDoc = navigationDocument.documents[navigationDocument.documents.length-2];
  console.log('===== currentDoc: ' + view + ' currentPMS: ' + pmsId + ' currentPath: ' + pmsPath);
  var doc = Presenter.setupRefreshDocument(view, pmsId, pmsPath);
  console.log('===== newDoc: ' + view + ' newPMS: ' + pmsId + ' newPath: ' + pmsPath);
  navigationDocument.replaceDocument(doc, currentDoc);
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
     if (!currentDoc || (id!="Search" && id!="Settings")) {  // todo: better algorithm to decide on doc reload now force reload if not Settings, Search
     var doc = Presenter.setupViewDocument(view, pmsId, pmsPath);
     feature.setDocument(doc, elem);
    }
  }
},
  
loadMenuContentNoRefresh: function(view, pmsId, pmsPath) {
  console.log("loadMenuContent");
  var elem = this.event.target;  // todo: check event existing
  var id = elem.getAttribute("id");
  
  var feature = elem.parentNode.getFeature("MenuBarDocument");
  if (feature) {
    var currentDoc = feature.getDocument(elem);
    if (!currentDoc) {
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
