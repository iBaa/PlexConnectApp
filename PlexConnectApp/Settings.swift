//
//  Settings.swift
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
        "theme": ([
            "Revenant", "Default", "Fanart", "Grids'n'Posters"
            ], 0
        ),
        "themeExternalOverride": ([
            "off", "127.0.0.1:1844"
            ], 0
        ),
        "showChannels": ([
            "Hide", "Show"
            ], 0
        ),
        
        "movieFanart": ([
            "Hide", "Show"
            ], 0
        ),
        
        "musicFanart": ([
            "Hide", "Show"
            ], 0
        ),
        
        "tvshowFanart": ([
            "Hide", "Show"
            ], 0
        ),

        "themeTitle": ([
            "Text", "Banner"
            ], 0
        ),
        "themeMusic": ([
            "Off", "On"
            ], 0
        ),
    ]
    
    init() {
        
    }
    
    func getUserKey(key: String) -> String {
        let userId = plexUserInformation.getAttribute("id")
        if userId == "" {
            return key  // provision for "offline" // fallback to original setting
        } else {
            return userId+"#"+key
        }
    }
    
    func getSetting(key: String) -> String {
        if let setting = _settings[key] {
            let (choices, dflt) = setting
            
            // get current selection ix
            var ix: Int
            let storedIx = _storage.integerForKey(getUserKey(key))-1  // -1 to work around 0==uninitialised
            if storedIx < 0 || storedIx >= choices.count {  // ==0: uninitialised; >count: out of range
                ix = dflt
            } else {
                ix = storedIx
            }
            
            return choices[ix]
        }
        return ""
    }
    
    func setSetting(key: String, ix: Int) {
        if let setting = _settings[key] {
            let (choices, dflt) = setting
            
            if ix < 0 || ix >= choices.count {  // ==0: uninitialised; >count: out of range
                _storage.setInteger(dflt+1, forKey: getUserKey(key))
            } else {
                _storage.setInteger(ix+1, forKey: getUserKey(key))
            }
        }
    }

    func toggleSetting(key: String) -> String {
        if let setting = _settings[key] {
            let (choices, dflt) = setting

            // get current selection ix
            var ix: Int
            let storedIx = _storage.integerForKey(getUserKey(key))-1  // -1 to work around 0==uninitialised
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
            _storage.setInteger(ix+1, forKey: getUserKey(key))
            return choices[ix]
        }
        return ""
    }
    
    func setDefaults() {
        for (key, (choices, dflt)) in _settings {
            _storage.setInteger(dflt+1, forKey: getUserKey(key))  // store +1, as get returns 0 if uninitialised
        }
    }
    
    func getCustomString(key: String) -> String {
        if let value = _storage.stringForKey(getUserKey(key)) {
            return value
        }
        return ""
    }
    
    func setCustomString(key: String, value: String) {
        _storage.setObject(value, forKey: getUserKey(key))
    }
}
