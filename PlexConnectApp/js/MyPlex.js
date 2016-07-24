/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

/*
 discover
 */
discover = function(event) {
  var elem = event.target;
  
  var doc = Presenter.setupViewDocument("MyPlex_Discover","","");
  navigationDocument.pushDocument(doc);
  
  var docString = swiftInterface.discover("Settings");
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");
  
  // update view
  var newElem = doc.getElementById(elem.getAttribute("id"));
  if (elem && newElem) {
    elem.innerHTML = newElem.innerHTML;
  }
  
  // remove Spinner, then eval(onSuccess)
  var doc = navigationDocument.documents[navigationDocument.documents.length-1];  // Spinner
  var func = elem.getAttribute('onSuccess');
  doc.addEventListener("unload", function() { eval(func) });
  navigationDocument.popDocument();
    
}



var myPlex = {
  
elem: null,
username: "",
password: "",
id: "",
pin: "",


updateSettings: function(fromDoc, toDoc)
{
  // update MyPlexSignInOut
  var fromElem = fromDoc.getElementById('MyPlexSignInOut');  // listItemLockup // _myPlexElem.getAttribute("id")
  var toElem = toDoc.getElementById('MyPlexSignInOut');
  if (fromElem && toElem) {
    toElem.innerHTML = fromElem.innerHTML;

    // copy attributes - cover signin/out, onSuccess, ...
    var keys = ["onSelect", "onSuccess", "onError"];  // todo: others?
    for (var key of keys) {
      toElem.setAttribute(key, fromElem.getAttribute(key));
    }
  }
  
  // update Discover
  var fromElem = fromDoc.getElementById('Discover');
  var toElem = toDoc.getElementById('Discover');
  if (fromElem && toElem) {
    toElem.innerHTML = fromElem.innerHTML;
  }
    
  // update PlexHome
  var fromElem = fromDoc.getElementById('MyPlexHomeUser');
  var toElem = toDoc.getElementById('MyPlexHomeUser');
  if (fromElem && toElem) {
    toElem.innerHTML = fromElem.innerHTML;
  }
},


/*
 myPlex sign in/out
 */
signIn: function(event)
{
  myPlex.elem = event.target;
  if (!myPlex.elem) return;  // error - element not found

  // request username
  Presenter.load("MyPlex_SignInUsername","","");
},

signIn_gotUsername: function(event)
{
  var elem = event.target;
  if (!elem) return;  // error - element not found

  // read username form UI
  var doc = elem.ownerDocument;
  var textField = doc.getElementByTagName("textField");
  var keyboard = textField.getFeature("Keyboard"); // get the textField's Keyboard element
  myPlex.username = keyboard.text;
  
  if (!myPlex.username) {
    // empty string - try again
    var doc = navigationDocument.documents[navigationDocument.documents.length-1];
    navigationDocument.popDocument();
    navigationDocument.pushDocument(doc);
  } else {
    // request password
    var newDoc = Presenter.setupViewDocument("MyPlex_SignInPassword","","");
    navigationDocument.replaceDocument(newDoc, doc);  // todo: loadAndSwap hangs?!
  }
},
  
signIn_gotPassword: function(event)
{
  var elem = event.target;
  if (!elem) return;  // error - element not found
  
  // read password form UI
  var doc = elem.ownerDocument;
  var textField = doc.getElementByTagName("textField");
  var keyboard = textField.getFeature("Keyboard"); // get the textField's Keyboard element
  myPlex.password = keyboard.text;

  if (!myPlex.password) {
    // empty string - try again
    var doc = navigationDocument.documents[navigationDocument.documents.length-1];
    navigationDocument.popDocument();
    navigationDocument.pushDocument(doc);
  } else {
    // go on, sign in...
    var docSpinner = createSpinner(TEXT("MyPlex: Signing in..."));
    navigationDocument.replaceDocument(docSpinner, doc);

    myPlex.signIn_do();
  }
},
  
signIn_do: function() {
  // store current key values
  var onSuccess = myPlex.elem.getAttribute("onSuccess");
  var onError = myPlex.elem.getAttribute("onError");

  // login and get new settings page
  var docString = swiftInterface.signInUserPasswordView(myPlex.username, myPlex.password, "Settings");
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");
  
  // update view
  var settingsDoc = myPlex.elem.ownerDocument
  myPlex.updateSettings(doc, settingsDoc);  // Settings page, covered by Spinner
  
  // check success, signal failed
  var elem = doc.getElementById('MyPlexSignInOut');
  try {  // in fresh received settings view - should never fail
    var elem_label = elem.getElementByTagName('decorationLabel');
    var username = elem_label.textContent;
  }
  catch (err) {
    username = undefined
  }
  
  if (username)
  {
    console.log("MyPlex Signin - success");
    
    // remove Spinner, then eval(onSuccess)
    var doc = navigationDocument.documents[navigationDocument.documents.length-1];  // Spinner
    doc.addEventListener("unload", function() { eval(onSuccess) });
    navigationDocument.popDocument();  // remove Spinner
  }
  else
  {
    console.log("MyPlex Signin - failed");
    
    // remove Spinner, then eval(onError)
    var doc = navigationDocument.documents[navigationDocument.documents.length-1];  // Spinner
    doc.addEventListener("unload", function() { eval(onError) });
    navigationDocument.popDocument();  // remove Spinner
  }
},

signOut: function(event)
{
  var elem = event.target;
  if (!elem) return;  // error - element not found

  var settingsDoc = elem.ownerDocument;
  
  // logout and get new settings page
  var docString = swiftInterface.signOut("Settings");
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");
  
  // update view
  myPlex.updateSettings(doc, settingsDoc);
  
  console.log("MyPlex Signout - done");
},


/*
 switch myPlex HomeUser
 */
signInHomeUser: function() {
  // login and get new settings page
  var docString = swiftInterface.switchHomeUserIdPinView(myPlex.id, myPlex.pin, "Settings");
  var parser = new DOMParser();
  var newDoc = parser.parseFromString(docString, "application/xml");
  
  // check success, signal failed
  var newElem = newDoc.getElementById('MyPlexHomeUser');
  if (newElem) {
    var username = newElem.getTextContent('decorationLabel');
    if (username == myPlex.username)
    {
      console.log("MyPlex HomeUser Login - done");
      
      // update Settings page
      // PlexHome
      var doc = navigationDocument.documents[navigationDocument.documents.length-3];  // Settings page, covered by HomeUser list, Spinner
      try {  // MyPlexHomeUser element
        var elem = doc.getElementById('MyPlexHomeUser');
      }
      catch (err) {
        elem = undefined
      }
      if (!elem) {
        try {  // try menuBar.menuContent
          elem = doc.getElementById('Settings');
          var feature = elem.parentNode.getFeature("MenuBarDocument");
          doc = feature.getDocument(elem);  // todo: check for feature existing?
          elem = doc.getElementById('MyPlexHomeUser');
        }
        catch(err) {  // still no MyPlexHomeUser
          elem = undefined;
        }
      }
      if (elem) {
        elem.innerHTML = newElem.innerHTML;
      }
      
      // update Discover
      if (elem) {
        var elem = elem.ownerDocument.getElementById('Discover');
        var newElem = newDoc.getElementById('Discover');
        if (elem && newElem) {
          elem.innerHTML = newElem.innerHTML;
        }
      }
      
      // remove Spinner, then eval(onSuccess)
      var doc = navigationDocument.documents[navigationDocument.documents.length-1];  // Spinner
      var func = myPlex.elem.getAttribute('onSuccess');
      doc.addEventListener("unload", function() { eval(func) });
      navigationDocument.popDocument();  // remove Spinner
    }
    else
    {
      console.log("MyPlex HomeUser Login - failed");
      
      // remove Spinner, then eval(onError)
      var doc = navigationDocument.documents[navigationDocument.documents.length-1];  // Spinner
      var func = myPlex.elem.getAttribute('onError');
      doc.addEventListener("unload", function() { eval(func) });
      navigationDocument.popDocument();  // remove Spinner
    }
  }
},
  
switchHomeUser: function(event) {
  console.log("switchHomeUser");
  
  myPlex.elem = event.target;
  if (!myPlex.elem) return;  // error - element not found
  
  // init local storage
  myPlex.username = myPlex.elem.getAttribute('username');
  myPlex.id = myPlex.elem.getAttribute('id');
  myPlex.pin = "";
  var protected = myPlex.elem.getAttribute('protected');
  
  if (protected=='1')
  {
    // request pin for "protected" user
    var doc = Presenter.setupViewDocument("MyPlex_SignInHomeUserPin","","");

    // setup event onTextChange
    var textField = doc.getElementByTagName("textField");
    var keyboard = textField.getFeature("Keyboard"); // get the textField's Keyboard element
    keyboard.onTextChange = function() {
      myPlex.pin = keyboard.text;
      if (myPlex.pin.length == 4) {
        // got pin - run spinner and sign in
        var docSpinner = createSpinner(TEXT("MyPlex: Signing in..."));
        navigationDocument.replaceDocument(docSpinner, doc);
        
        myPlex.signInHomeUser();
      }
    }
    navigationDocument.pushDocument(doc);
  }
  else
  {
    // run spinner and sign in - pin=""
    var docSpinner = createSpinner(TEXT("MyPlex: Signing in..."));
    navigationDocument.pushDocument(docSpinner);
    
    myPlex.signInHomeUser();
  }
},
  
  
/*
 switch PlexMediaServer
 */
switchServer: function(event) {
  console.log("switchServer");

  var elem = event.target;
  if (!elem) return;  // error - element not found
  
  var uuid = elem.getAttribute('id');
  swiftInterface.setCustomSettingValue('pmsUuid', uuid);
  
  // eval(onSuccess)
  var func = elem.getAttribute('onSuccess');
  eval(func);
  // example:
  // *.popDocument()  // remove Server selection page
  // *.loadAndSwap("Library", pmsId, pmsPath)  // reload main page
},
}
