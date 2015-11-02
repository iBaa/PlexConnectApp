//
//  Settigns.swift
//  PlexConnectApp
//
//  Created by Baa on 28.10.15.
//  Copyright © 2015 Baa. All rights reserved.
//

import Foundation



// Settings
// https://www.hackingwithswift.com/example-code/system/how-to-save-user-settings-using-nsuserdefaults
// http://www.codingexplorer.com/nsuserdefaults-a-swift-introduction/



// create class instance (always-on!)
let settings = cSettings()



// settings
class cSettings {
    let _storage = NSUserDefaults.standardUserDefaults()
    
    let _settings: [String: ([String], Int)] = [
        "transcoderQuality": ([
            "480p 2.0Mbps",
            "720p 3.0Mbps", "720p 4.0Mbps",
            "1080p 8.0Mbps", "1080p 12.0Mbps", "1080p 20.0Mbps", "1080p 40.0Mbps"
            ], 6
        ),
        "remoteBitrate"     : ([
            "480p 2.0Mbps",
            "720p 3.0Mbps", "720p 4.0Mbps",
            "1080p 8.0Mbps", "1080p 12.0Mbps", "1080p 20.0Mbps", "1080p 40.0Mbps"
            ], 1
        ),
        "transcoderAction"  : ([
            "Auto", "DirectPlay", "Transcode"
            ], 0
        ),
    ]
    
    init() {
        
    }
    
    func getSetting(key: String) -> String {
        if let setting = _settings[key] {
            let (choices, dflt) = setting
            
            // get current selection ix
            var ix: Int
            let storedIx = _storage.integerForKey(key)-1  // -1 to work around 0==uninitialised
            if storedIx < 0 || storedIx >= choices.count {  // ==0: uninitialised; >count: out of range
                ix = dflt
            } else {
                ix = storedIx
            }
            
            return choices[ix]
        }
        return ""
    }
    
    func toggleSetting(key: String) -> String {
        if let setting = _settings[key] {
            let (choices, dflt) = setting

            // get current selection ix
            var ix: Int
            let storedIx = _storage.integerForKey(key)-1  // -1 to work around 0==uninitialised
            if storedIx < 0 || storedIx >= choices.count {  // <0: uninitialised; >count: out of range
                ix = dflt
            } else {
                ix = storedIx
            }

            // next selection, roll over if neccessary
            ix = ix + 1
            if ix >= choices.count {
                ix = 0
            }
            
            // store selection ix
            _storage.setInteger(ix+1, forKey: key)
            return choices[ix]
        }
        return ""
    }
    
    func setDefaults() {
        for (key, (choices, dflt)) in _settings {
            _storage.setInteger(dflt+1, forKey: key)  // store +1, as get returns 0 if uninitialised
        }
    }
}
