//
//  Server.swift
//  PlexConnectApp
//
//  Created by Baa on 29.09.15.
//  Copyright © 2015 Baa. All rights reserved.
//

import Foundation


var server: SwiftHTTP?
var TVBaseURL: String?

func runServer() {
    // Server - SwiftHTTP
    // https://github.com/eaigner/SwiftHTTP
    server = SwiftHTTP()
    server?.headersReceivedHandler = { req in
        //print("headers: \(req.headers)")
    }
    server?.dataAvailableHandler = { req, data in
        //print("received \(data.length) bytes")
    }
    server?.responseHandler = { req, resp -> Void in
        //resp.body = "hello from SwiftHTTP".dataUsingEncoding(NSUTF8StringEncoding, allowLossyConversion: false)
        SwiftHTTP_responseHandler(req, resp: resp)
    }
    
    if let err = server?.listen(0) {
        print("could not listen on port 3000: \(err)")
    } else {
        print("listening on port \(server!.port)")
    }
    
    TVBaseURL = "http://localhost:\(server!.port)"
}

func shutdownServer() {
    server?.close()
}



func SwiftHTTP_responseHandler(req: SwiftHTTP.Request, resp: SwiftHTTP.Response) -> Bool {
    // parse request: what filetype?
    //print("method: \(req.method)")
    //print("URL-path: \(req.URL.path)")
    //print("URL-file: \(req.URL.lastPathComponent)")
    //print("URL-ext : \(req.URL.pathExtension)")
    //print("headers: \(req.headers)")
    
    switch req.URL.pathExtension {
        
    case "js"?:
        // get js
        let file = req.URL.lastPathComponent!
        
        // process file - eg. localise {{TEXT}}
        let processor = cXmlConverter()
        processor.setup(file, pmsId: nil, pmsPath: nil, query: [:])
        let jsProcessed = processor.doIt()
        //print(jsProcessed)

        // send response
        resp.headers = ["Server": "PlexConnect", "Content-type": "text/javascript"]
        resp.body = jsProcessed.dataUsingEncoding(NSUTF8StringEncoding)

        return true
        
    case "xml"?:
        processXMLRequest(req, resp: resp)
        return false  // don't auto respond
        
    default:
        // don't serve anything, return 404
        resp.status = 404
        resp.body = "File not found".dataUsingEncoding(NSUTF8StringEncoding)
        return true
    }
    
}



func processXMLRequest(req: SwiftHTTP.Request, resp: SwiftHTTP.Response) {
    
    var queryStrings = [String: String]()
    if let query = req.URL.query {
        for qs in query.componentsSeparatedByString("&") {
            let range = qs.rangeOfString("=")
            // Get the parameter name
            let key = qs.substringToIndex(range!.startIndex)
            // Get the parameter value
            var value = qs.substringFromIndex(range!.endIndex)
            value = value.stringByReplacingOccurrencesOfString("+", withString: " ")
            value = value.stringByRemovingPercentEncoding!
            
            queryStrings[key] = value
        }
    }

    var PMSPath, PMSId: String?
    PMSPath = queryStrings["X-PMSPath"]
    PMSId = queryStrings["X-PMSId"]

    // XMLConverter - process TVMLTemplate
    let file = req.URL.lastPathComponent!
    
    if let cmd = queryStrings["X-PMS-Command"] {
        if cmd=="MyPlexSignIn" {
            let _username = queryStrings["X-PMS-Username"]!.stringByRemovingPercentEncoding!
            let _password = queryStrings["X-PMS-Password"]!.stringByRemovingPercentEncoding!
            
            myPlexSignIn(_username, password: _password)
        } else if cmd=="MyPlexSignOut" {
            myPlexSignOut()
        } else if cmd=="Discover" {
            discoverServers()
        } else if cmd=="ToggleSetting" {
            if let key = queryStrings["X-PMS-Setting"] {
                settings.toggleSetting(key)
            }
        }
    }
    
    var TVMLTemplate: String = ""
    
    let processor = cXmlConverter()  // new class instance each time? or just re-setup and run?
    processor.setup(file, pmsId: PMSId, pmsPath: PMSPath, query: queryStrings)
    
    TVMLTemplate = processor.doIt()
    print(TVMLTemplate)
    
    // provide response
    resp.headers = ["Server": "Plex Media Server Interface", "Content-type": "text/xml"]
    resp.body = TVMLTemplate.dataUsingEncoding(NSUTF8StringEncoding)
}
