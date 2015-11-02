//
//  SwiftHTTP.swift
//  SwiftHTTP
//
//  The MIT License (MIT)
//
//  Copyright (c) 2015 Erik Aigner
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.

import Darwin
import Foundation
import CFNetwork

private let hdrContentLen = "Content-Length"
private let hdrConnection = "Connection"
private let hdrContentType = "Content-Type"

class SwiftHTTP {
	
	typealias Error = (Int, String)
	
	var headersReceivedHandler : ((Request) -> Void)?
	var dataAvailableHandler : ((Request, NSData) -> Void)?
	var responseHandler : ((Request, Response) -> Void)?
	
	private var fd : Int32 = 0
	private var ds : dispatch_source_t?
	private(set) var port : UInt16 = 0
	
	struct Request {
		let method : String
		let URL : NSURL
		let headers : NSDictionary
	}
	
	class Response {
		var status = 200
		var httpVersion = kCFHTTPVersion1_1
		var headers = [String:String]()
		var body : NSData?
	}
	
	init() {}
	
	func listen(port: UInt16 = 0) -> Error? {
		if fd > 0 {
			return (0, "already listening")
		}
		
		// create the socket
		fd = Darwin.socket(AF_INET, SOCK_STREAM, 0)
		if fd < 0 {
			return (1, "could not create socket")
		}
		
		// set options
		var reuse : Int = 0
		if Darwin.setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, socklen_t(sizeof(Int))) != 0 {
			return (2, "could not set socket options")
		}
		
		// bind
		let addr = UnsafeMutablePointer<sockaddr>.alloc(1)
		let inAddr = UnsafeMutablePointer<sockaddr_in>(addr)
		inAddr.memory.sin_len = __uint8_t(sizeof(sockaddr_in))
		inAddr.memory.sin_family = sa_family_t(AF_INET)
		inAddr.memory.sin_addr.s_addr = CFSwapInt32HostToBig(0)
		inAddr.memory.sin_port = CFSwapInt16HostToBig(port)
		
		if Darwin.bind(fd, addr, socklen_t(sizeof(sockaddr_in))) != 0 {
			Darwin.close(fd)
			return (3, "unable to bind socket")
		}
		
		addr.dealloc(1)
		
		// get the assigned port
		let outAddr = UnsafeMutablePointer<sockaddr_in>.alloc(1)
		let inOutLen = UnsafeMutablePointer<socklen_t>.alloc(1)
		inOutLen.memory = socklen_t(sizeof(sockaddr_in))
		
		if Darwin.getsockname(fd, UnsafeMutablePointer<sockaddr>(outAddr), inOutLen) != 0 {
			Darwin.close(fd)
			return (4, "could not get socket name")
		}
		
		self.port = CFSwapInt16BigToHost(outAddr.memory.sin_port)
		
		outAddr.dealloc(1)
		inOutLen.dealloc(1)
		
		// listen
		if Darwin.listen(fd, SOMAXCONN) != 0 {
			Darwin.close(fd)
			return (5, "could not listen on socket")
		}
		
		// create a dispatch source
		ds = dispatch_source_create(DISPATCH_SOURCE_TYPE_READ, UInt(fd), 0, dispatch_get_global_queue(0, 0))
		if ds == nil {
			Darwin.close(fd)
			return (6, "could not create dispatch source")
		}
		
		dispatch_source_set_event_handler(ds!) { self.handleConn() }
		dispatch_resume(ds!)
		
		return nil
	}
	
	deinit {
		self.close()
	}
	
	func close() {
		Darwin.close(fd)
		if let src = ds {
			dispatch_source_cancel(src)
		}
	}
	
	private func handleRequest(msg: CFHTTPMessage) -> (Request?, Int?) {
		let method = CFHTTPMessageCopyRequestMethod(msg)!.takeRetainedValue() as String
		let url = CFHTTPMessageCopyRequestURL(msg)!.takeRetainedValue()
		let hdrs = CFHTTPMessageCopyAllHeaderFields(msg)!.takeRetainedValue() as NSDictionary
		let req = Request(method: method, URL: url, headers: hdrs)
		var contentLength = 0
		
		if let v = hdrs[hdrContentLen]?.integerValue {
			contentLength = v
		}
		
		headersReceivedHandler?(req)
		
		return (req, contentLength)
	}
	
	private func handleConn() {
		
		let conn = Darwin.accept(fd, nil, nil)
		
		let bufLen = 1024*8
		let data = UnsafeMutablePointer<UInt8>.alloc(bufLen)
		let httpMsg = CFHTTPMessageCreateEmpty(kCFAllocatorDefault, true).takeRetainedValue()
		let hdrsDone = UnsafeMutablePointer<Int32>.alloc(1)
		var req : Request?
		var bodyLen = 0
		var contentLen : Int?
		
		while true {
			let n = Darwin.read(conn, data, bufLen)
			if n <= 0 || CFHTTPMessageAppendBytes(httpMsg, data, n) == false {
				break
			}
			
			if CFHTTPMessageIsHeaderComplete(httpMsg) == true {
				// read the headers (once)
				if OSAtomicCompareAndSwap32Barrier(0, 1, hdrsDone) {
					(req, contentLen) = handleRequest(httpMsg)
				}
				
				// pass a chunk of data to the handler
				let chunk = CFHTTPMessageCopyBody(httpMsg)!.takeRetainedValue()
				let chunkLen = Int(CFDataGetLength(chunk))
				
				if chunkLen > 0 {
					bodyLen += chunkLen
					if let v = req {
						dataAvailableHandler?(v, chunk)
					}
					let emptyString = CFDataCreate(kCFAllocatorDefault, "", 0)
					CFHTTPMessageSetBody(httpMsg, emptyString)
				}
			}
			
			// check if we reached the end of the HTTP body
			if let v = contentLen {
				if bodyLen >= v {
					break
				}
			}
		}
		
		data.dealloc(bufLen)
		hdrsDone.dealloc(1)
		
		// create a default response
		let resp = Response()
		resp.headers[hdrConnection] = "close"
		resp.headers[hdrContentType] = "text/plain"
		
		if let v = req {
			responseHandler?(v, resp)
		}
		
		// assemble the HTTP message
		let respMsg = CFHTTPMessageCreateResponse(nil, resp.status, nil, resp.httpVersion).takeRetainedValue()
		
		for (k, v) in resp.headers {
			CFHTTPMessageSetHeaderFieldValue(respMsg, k, v)
		}
		if let b = resp.body {
			CFHTTPMessageSetHeaderFieldValue(respMsg, hdrContentLen, "\(CFDataGetLength(b))")
			CFHTTPMessageSetBody(respMsg, b)
		} else {
			CFHTTPMessageSetHeaderFieldValue(respMsg, hdrContentLen, "0")
		}
		
		// serialize it to the TCP socket
		let bytes = CFHTTPMessageCopySerializedMessage(respMsg)!.takeRetainedValue()
		if Darwin.write(conn, CFDataGetBytePtr(bytes), CFDataGetLength(bytes)) < 0 {
			print("error writing to tcp socket")
		}
		
		Darwin.close(conn)
	}
}
