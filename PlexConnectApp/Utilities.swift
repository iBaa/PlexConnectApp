//
//  Utilities.swift
//  PlexConnectApp
//
//  Created by Baa on 01.11.15.
//  Copyright © 2015 Baa. All rights reserved.
//

import Foundation



// extension to SWXMLHash, XMLIndexer
// getAttribute with default
// (should not live here, should it?)
// todo: check if SWXMLHash comes with similar funcionality
func getAttribute(xml: XMLIndexer, key: String, dflt: String) -> String {
    if let value = xml.element!.attributes[key] {
        return value
    }
    return dflt
}



/*
def getBalancedBrackets(str, pos=0):
.   start = str.find("<", pos)
.   next_start = start
.   end = start
.   while next_start<=end and next_start!=-1 and end!=-1:
.   .  next_start = str.find("<", next_start+1)
.   .  end = str.find(">", end+1)
.   .  return str[start:end+1]
*/
func getBalancedBrackets(str: String, pos: Int=0, open: String="(", close: String=")") -> Range<String.Index>? {
    var range = Range(start: str.startIndex.advancedBy(pos), end: str.endIndex)
    let start = str.rangeOfString(open, options: [], range: range)?.startIndex
    if start==nil {return nil}
    var end = start
    var next_start = start
    
    while ((next_start<=end) && !(next_start==nil) && !(end==nil)) {
        range.startIndex = next_start!.advancedBy(1)
        next_start = str.rangeOfString(open, options: [], range: range)?.startIndex
        range.startIndex = end!.advancedBy(1)
        end = str.rangeOfString(close, options: [], range: range)?.startIndex
    }
    if end==nil {
        return nil
    } else {
        return Range(start: start!, end: end!.advancedBy(close.characters.count))
    }
}

/*
RegEx
def getInnerBrackets(str, pos=0):
.   innerBrackets = re.search(r"<([^<]*?)>", str[pos:])
.   return innerBrackets.group(0)

or like above...
def getInnerBrackets(str, pos=0):
.   start = str.find("<", pos)
.   next_start = str.find("<", start+1)
.   end = str.find("<", start+1)
.   while next_start<=end and next_start!=-1 and end!=-1:
.   .   start = next_start
.   .   next_start = str.find("<", start+1)
.   .   end = str.find(">", start+1)
.   .   return str[start:end+1]

*/
func getInnerBrackets(str: String, pos: Int=0, open: String="(", close:  String=")") -> Range<String.Index>? {
    var range: Range<String.Index>?
    
    range = Range(start: str.startIndex.advancedBy(pos), end: str.endIndex)
    var start = str.rangeOfString(open, options: [], range: range)?.startIndex
    if start==nil {return nil}
    var next_start = start
    var end = start
    
    while ((next_start<=end) && !(next_start==nil) && !(end==nil)) {
        start = next_start
        range!.startIndex = start!.advancedBy(1)
        next_start = str.rangeOfString(open, options: [], range: range)?.startIndex
        end = str.rangeOfString(close, options: [], range: range)?.startIndex
    }
    if end==nil {
        return nil
    } else {
        return Range(start: start!, end: end!.advancedBy(close.characters.count))
    }
}



// find, open an read resourcefile
func readResource(file: NSString) -> NSString {
    // parse filename
    let pos = file.rangeOfString(".", options: NSStringCompareOptions.BackwardsSearch)
    let name = file.substringToIndex(pos.location)
    let ext = file.pathExtension // or substringFromIndex
    
    // find resource in bundle
    let bundle = NSBundle.mainBundle()
    let path = bundle.pathForResource(name, ofType: ext)
    //print(path)
    
    // read resource
    let content: NSString
    do {
        content = try NSString.init(contentsOfFile: path!, encoding: NSUTF8StringEncoding)
    } catch let error {
        content = ""
        print("***error reading file: \(error)")
    }
    
    //print(content)
    return content
}
