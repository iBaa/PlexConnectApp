//
//  AppDelegate.swift
//  PlexConnectApp
//
//  Created by Baa on 25.09.15.
//  Copyright © 2015 Baa. All rights reserved.
//

import UIKit
import TVMLKit



@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, TVApplicationControllerDelegate {

    // ** Properties
    var window: UIWindow?
    
    var appController: TVApplicationController?
    
    // ** UIApplication Overrides
    func application(application: UIApplication, didFinishLaunchingWithOptions launchOptions: [NSObject: AnyObject]?) -> Bool {
        // Override point for customization after application launch.
        window = UIWindow(frame: UIScreen.mainScreen().bounds)
        
        /*
            Create the TVApplicationControllerContext for this application
            and set the properties that will be passed to the `App.onLaunch` function
            in JavaScript.
        */
        let appControllerContext = TVApplicationControllerContext()
        
        /*
            The JavaScript URL is used to create the JavaScript context for your
            TVMLKit application. Although it is possible to separate your JavaScript
            into separate files, to help reduce the launch time of your application
            we recommend creating minified and compressed version of this resource.
            This will allow for the resource to be retrieved and UI presented to
            the user quickly.
        */
        
        let TVBaseURL = NSBundle.mainBundle().bundleURL.absoluteString
        if let javaScriptURL = NSURL(string: TVBaseURL + "/js/App.js") {
            appControllerContext.javaScriptApplicationURL = javaScriptURL
        }
        
        appControllerContext.launchOptions["BASEURL"] = TVBaseURL
        
        if let launchOptions = launchOptions as? [String: AnyObject] {
            for (kind, value) in launchOptions {
                appControllerContext.launchOptions[kind] = value
            }
        }
        
        //let bundleID = NSBundle.mainBundle().bundleIdentifier
        //appControllerContext.launchOptions["UIApplicationLaunchOptionsSourceApplicationKey"] = bundleID
        appController = TVApplicationController(context: appControllerContext, window: window, delegate: self)

        return true
    }

    func applicationWillResignActive(application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
        
        print("WillResignActive")
    }

    func applicationDidEnterBackground(application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
        print("DidEnterBackground")
    }

    func applicationWillEnterForeground(application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
        print("WillEnterForeground")
    }

    func applicationDidBecomeActive(application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        print("DidBecomeActive")
    }

    func applicationWillTerminate(application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
        print("WillTerminate")
    }

    // ** TVApplicationControllerDelegate
    func appController(appController: TVApplicationController, didFinishLaunchingWithOptions options: [String: AnyObject]?) {
        print("\(__FUNCTION__) invoked with options: \(options)")
    }
    
    func appController(appController: TVApplicationController, didFailWithError error: NSError) {
        print("\(__FUNCTION__) invoked with error: \(error)")
        
        let title = "Error Launching Application"
        let message = error.localizedDescription
        let alertController = UIAlertController(title: title, message: message, preferredStyle:.Alert )
        
        self.appController?.navigationController.presentViewController(alertController, animated: true, completion: { () -> Void in
            // ...
        })
    }
    
    func appController(appController: TVApplicationController, didStopWithOptions options: [String: AnyObject]?) {
        print("\(__FUNCTION__) invoked with options: \(options)")
    }
    
    func appController(appController: TVApplicationController, evaluateAppJavaScriptInContext jsContext: JSContext) {
        let jsInterface: cJsInterface = cJsInterface();
        jsContext.setObject(jsInterface, forKeyedSubscript: "swiftInterface")
    }
}
