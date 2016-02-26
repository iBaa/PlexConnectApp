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

if (!Element.prototype.getTextContent) {
    Element.prototype.getTextContent = function(tagName) {
        var element = this;
        if (tagName) {
            var element = this.getElementByTagName(tagName);
        }
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



// range
function range(start, end) {
    var arr = [];
    for (var i = start; i <= end; i++) {
        arr.push(i);
    }
    return arr;
}

// shuffleArray
// basics from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(arr) {
    var temp, j, i = arr.length;
    while (--i) {
        j = ~~(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    
    return arr;
}



// Networking stuff

// Send http request - disregard response
function loadPage(url)
{
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.send();
};

function putData(url)
{
    var req = new XMLHttpRequest();
    req.open('PUT', url, true);
    req.send();
};


// prepare for localisation - currently just return string
function TEXT(textString) {
    return textString
}


// instant documents
var createSpinner = function(title) {
  var docString = `<?xml version="1.0" encoding="UTF-8" ?>
<document>
  <loadingTemplate>
    <activityIndicator>
      <title>${title}</title>
    </activityIndicator>
  </loadingTemplate>
</document>`
  var parser = new DOMParser();
  var doc = parser.parseFromString(docString, "application/xml");
  return doc;
}
