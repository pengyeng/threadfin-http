var threadfin = {};
module['exports'] = threadfin;

var http = require('http');
var https = require('https');
var fs = require('fs');
var zlib = require('zlib');
var myObjectList = Array(); 

function passing_object(objectList){
	myObjectList = objectList;
}	

function start(config_path){

	//Loading Config File
	try {
		var configData = fs.readFileSync(config_path),configObj;
		configObj = JSON.parse(configData);
	}catch (err) {
		console.log('There has been an error parsing your JSON.')
		console.log(err);
	}

	var handler = function (req, res) {

		var targetServer = configObj.target_server;
		var proxyEnabled = configObj.proxy;

		var requestURL = req.url;
		var acceptEncoding = req.headers['accept-encoding'];
		var ziplibStatus = configObj.compression ;
		
		if (!acceptEncoding) {
			acceptEncoding = '';
		}
		try{
			var validUser = false;

			if (configObj.protect){

				var authenticator = require('./lib/module/authentication');
				authenticator.load(configObj.user_acl);

				var auth = req.headers['authorization'];
				var protected = authenticator.protectedzone(requestURL);
				if (!(auth)){
					if (protected){
						res.writeHead(401, {
							'WWW-Authenticate': 'Basic realm="Security Realm"'
						});
						res.end();
					}
				}else{
					var raw = auth.split(' ');
					var buffer = new Buffer(raw[1], 'base64');
					var decodeCredential = buffer.toString();
					var credential = decodeCredential.split(':');
					var id = credential[0];
					var password = credential[1];

					//Authentication Module
					var validUser =	authenticator.authenticate(id,password);

				}
			}			
			if (!(configObj.protect) || validUser || !(protected)){

				// Handle Compression
				if ((acceptEncoding.match(/\bdeflate\b/)) && (ziplibStatus === "D")) {
					res.writeHead(200, { 'content-encoding': 'deflate' });
					ziplibStatus = "D";
				} else if ((acceptEncoding.match(/\bgzip\b/)) && (ziplibStatus === "Z")) {
					res.writeHead(200, { 'content-encoding': 'gzip' });
					ziplibStatus = "Z";
				} else {
					ziplibStatus = "";
				}

				//Handle HTML content

				//Proxy Implementation
				if (proxyEnabled) {

					var httpClient = require('./lib/module/httpclient');
					httpClient.submitHTTPRequest(targetServer,requestURL,res);

				}else{
					var fstat = fs.statSync(configObj.doc_root+requestURL);
				}

				if (!(proxyEnabled)) {
					if (fstat.isFile()) {

						var indMP4 = requestURL.search(".mp4");
						if (indMP4 > 0) {
							console.log("this is a video mp4 file");
							var rangeRequest = req.headers.range;
							var rangePositions = rangeRequest.replace(/bytes=/, "").split("-");
							var startPosition = parseInt(rangePositions[0], 10);
							var partialEndPosition = parseInt(rangePositions[1], 10);
							var total = fstat.length;
							var endPosition = partialEndPosition ? parseInt(partialEndPosition, 10) : total - 1;
							var contentChunkSize = (endPosition - startPosition) + 1;
							res.writeHead(206, {
								"Content-Range": "bytes " + startPosition + "-" + endPosition + "/" + total,
								"Accept-Ranges": "bytes",
								"Content-Length": contentChunkSize,
								"Content-Type": "video/mp4"
							});
							res.end(fstat.slice(startPosition, endPosition + 1));

						} else {
							if (ziplibStatus === "D") {
								var raw = fs.createReadStream(configObj.doc_root + requestURL);
								raw.pipe(zlib.createDeflate()).pipe(res);
							} else if (ziplibStatus === "Z") {
								var raw = fs.createReadStream(configObj.doc_root + requestURL);
								raw.pipe(zlib.createGzip()).pipe(res);
							} else {
								var requestData = fs.readFileSync(configObj.doc_root + requestURL);
								res.writeHead(200, {'Content-Type': 'text/html'});
								res.end(requestData);
							}
						}
					} else if (fstat.isDirectory()) {
						//Handle Default Page
						var defaultfstat = fs.statSync(configObj.doc_root + requestURL + "/" + configObj.default_page);
						if (defaultfstat.isFile()) {
							if (ziplibStatus === "D") {
								var raw = fs.createReadStream(configObj.doc_root + requestURL + "/" + configObj.default_page);
								raw.pipe(zlib.createDeflate()).pipe(res);
							} else if (ziplibStatus === "Z") {
								var raw = fs.createReadStream(configObj.doc_root + requestURL + "/" + configObj.default_page);
								raw.pipe(zlib.createGzip()).pipe(res);
							} else {
								var requestData = fs.readFileSync(configObj.doc_root + requestURL + "/" + configObj.default_page);
								res.writeHead(200, {'Content-Type': 'text/html'});
								res.end(requestData);
							}
						}
					}
				}
			}else{
				//Handle Authorisation Error
				res.writeHead(401, {'Content-Type': 'text/html'});
				var requestData = fs.readFileSync('./error/401.html');
				res.end(requestData);
			}
		}catch(err){
			try{
				var n = requestURL.search("\\?");
				if (n=== -1){
					var handlerPath = requestURL;
				}else{
					var handlerPath = requestURL.substr(0,n);
				}
				//Handle API request
				if (fs.existsSync(configObj.api_root+handlerPath+configObj.api_handler_postfix+'.js')) {
					var requestHandler = require('../../'+configObj.api_root+handlerPath+configObj.api_handler_postfix+'.js');
					
					if (myObjectList != null){
						console.log("myObjectList is not Null");
						for (i=0;  i < myObjectList.length; i++) 
						{
						   var element = Array();
						   element = myObjectList[i];
                           console.log(element[0]);
						   console.log(configObj.api_root+handlerPath);						   
                          if (element[0] == configObj.api_root+handlerPath){
							console.log("object matched");  
						    requestHandler.setObjectList(element[1]);							               
                            break;							
   						  } 	  
                        } 	
					}	
					requestHandler.process(configObj,req,res);
				}else{
					//Handle Page Not Found
					res.writeHead(404, {'Content-Type': 'text/html'});
					var requestData = fs.readFileSync('./error/404.html');
					res.end(requestData);
					console.log('request not found :'+req.url);
				}
			}catch(err){
				//Handle Page Not Found
				console.log(err);
				res.writeHead(404, {'Content-Type': 'text/html'});
				var requestData = fs.readFileSync('./error/404.html');
				res.end(requestData);
				console.log('request not found :'+req.url);
			}
		}
	}

// SSL Implementation
	if (configObj.ssl == "Y"){
		var privateKey = fs.readFileSync(configObj.ssl_private_key);
		var certificate = fs.readFileSync(configObj.ssl_cert);
		var credentials = {key: privateKey, cert: certificate};
		var server = https.createServer(credentials,handler);
	}else{
		var server = http.createServer(handler);
	}

	server.listen(configObj.server_port);
	console.log('Server running at http://server_ip_address:'+configObj.server_port);
}

module.exports.start = start;
module.exports.passing_object = passing_object;
