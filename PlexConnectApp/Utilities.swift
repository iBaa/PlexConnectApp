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



// find, open and read resourcefile
func readTVMLTemplate(name: String, theme: String) -> String {
    var content: String

    let themeExternalOverride = settings.getSetting("themeExternalOverride")
    if themeExternalOverride == "off" {
        // get resource from bundle
        let theme = settings.getSetting("theme")
        if let themeContent = readResource(name, ext: "xml", dir: "TVMLTemplates"+"/" + theme) {
            content = themeContent
        } else {
            if let defaultContent = readResource(name, ext: "xml", dir: "TVMLTemplates"+"/"+"Default") {
                content = defaultContent
            } else {
                content = ""
            }
        }
    } else {
        // catch external TVMLTemplate
        if let extContent = readExternalContent("http://" + "127.0.0.1:1844" + "/" + name + ".xml") {  // todo: flexible IP:port
            content = extContent
        } else {
            if let noContent = readResource("Theme_NoExternal", ext: "xml", dir: "TVMLTemplates") {
                content = noContent
            } else {
                content = ""
            }
        }

    }
    
    //print(content)
    return content
}

func readResource(file: String, ext: String, dir: String) -> String? {
    var content: String?
    
    // find resource in bundle
    let bundle = NSBundle.mainBundle()
    let path = bundle.pathForResource(file, ofType: ext, inDirectory: dir)
    if path == nil {
        return nil
    }
    
    // read resource
    do {
        content = try NSString.init(contentsOfFile: path!, encoding: NSUTF8StringEncoding) as String
    } catch let error {
        content = nil
        print("***error reading file: \(error)")
    }
    return content
}

// get resource from remote url
func readExternalContent(url: String) -> String? {
    // request URL, wait for response, return data
    var content: String? = nil
    
    let dsptch = dispatch_semaphore_create(0)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), {
        let _nsurl = NSURL(string: url)        
        let _nsurlSessionConfiguration = NSURLSessionConfiguration.defaultSessionConfiguration()
        _nsurlSessionConfiguration.URLCache = nil  // for development: do not cache anything, always load current TVMLTemplate
        let _nsurlSession = NSURLSession(configuration: _nsurlSessionConfiguration)
        
        let task = _nsurlSession.dataTaskWithURL(_nsurl!, completionHandler: { (data, response, error) -> Void in
            // get response
            if (error == nil) {
                if let httpResp = response as? NSHTTPURLResponse {
                    if httpResp.statusCode == 200 {
                        content = String(data: data!, encoding: NSUTF8StringEncoding)
                    }
                }
            }
            dispatch_semaphore_signal(dsptch)
        });
        task.resume()
    })
    dispatch_semaphore_wait(dsptch, dispatch_time(DISPATCH_TIME_NOW, httpTimeout))
    
    return content
}



// find resourcefile, return URL
func getResourceUrl(file: String, ext: String, dir: String) -> String {
    let bundle = NSBundle.mainBundle()
    if let url = bundle.URLForResource(file, withExtension: ext, subdirectory: dir) {
        return url.absoluteString
    }
    return ""
}
