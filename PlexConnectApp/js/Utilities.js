/*
 Copyright (C) 2015 Baa. All rights reserved.
 See LICENSE.txt for this sample’s licensing information
 */

// DOM/Document/Element extensions
if (!Document.prototype.getElementByTagName) {
  Document.prototype.getElementByTagName = function(tagName) {
    var elements = this.getElementsByTagName(tagName);
    if ( elements && elements.length > 0 ) {
      return elements.item(0);
    }
    return undefined;
  }
}


if (!Element.prototype.getElementByTagName) {
  Element.prototype.getElementByTagName = function(tagName) {
    var elements = this.getElementsByTagName(tagName);
    if ( elements && elements.length > 0 ) {
      return elements.item(0);
    }
    return undefined;
  }
}


if (!Document.prototype.getTextContent) {
  Document.prototype.getTextContent = function(tagName) {
    var element = this.getElementByTagName(tagName);
    if (element && element.textContent) {
      return element.textContent;
    }
    return '';
  }
}



// String extensions
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
                        return typeof args[number] != 'undefined'
                        ? args[number]
                        : match
                        ;
                        });
  };
}



// Networking stuff

// Send http request - disregard response
function loadPage(url)
{
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.send();
};

