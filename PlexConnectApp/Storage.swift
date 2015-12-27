//
//  Storage.swift
//  PlexConnectApp
//
//  Created by Baa on 28.10.15.
//  Copyright © 2015 Baa. All rights reserved.
//

import Foundation



// create class instance (always-on!)
let storage = cStorage()



// storage
class cStorage {
    let _storage = NSUserDefaults.standardUserDefaults()
  
    init() {
        
    }
    
    func getString(key: String) -> String {
        if let value = _storage.stringForKey(key) {
            return value
        }
        return ""
    }
    
    func setString(key: String, value: String) {
        _storage.setObject(value, forKey: key)
    }
}
