var http = require('http');
var fs = require('fs');
var zlib = require('zlib');
var configData = fs.readFileSync('./config.json'),configObj;

function start(){
try {
    configObj = JSON.parse(configData);
}catch (err) {
    console.log('There has been an error parsing your JSON.')
    console.log(err);
}

http.createServer(function (req, res) {	
  		 
  var requestURL = req.url;
  var acceptEncoding = req.headers['accept-encoding'];
  var ziplibStatus = configObj.compression ;

  
  if (!acceptEncoding) {
    acceptEncoding = '';
  }  
  try{
	var validUser = false;	
	
	if (configObj.security){ 
		
		var authenticator = require('./module/authentication.js');		

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
	
	if (!(configObj.security) || validUser || !(protected)){
		
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
		var fstat = fs.statSync('./'+configObj.doc_root+requestURL);
		if (fstat.isFile()){

			var indMP4 = requestURL.search(".mp4");
			if (indMP4 > 0){
				console.log("this is a video mp4 file");
				var rangeRequest = req.headers.range;
				var rangePositions = rangeRequest.replace(/bytes=/, "").split("-");
				var startPosition = parseInt(rangePositions[0], 10);
				var partialEndPosition = parseInt(rangePositions[1], 10);
				var total = fstat.length;
				var endPosition = partialEndPosition ? parseInt(partialEndPosition, 10) : total - 1;
				var contentChunkSize = (endPosition-startPosition)+1;
				res.writeHead(206, { "Content-Range": "bytes " + startPosition + "-" + endPosition + "/" + total,
						"Accept-Ranges": "bytes",
						"Content-Length": contentChunkSize,
						"Content-Type":"video/mp4"});
				res.end(fstat.slice(startPosition, endPosition+1));

			}else {
				if (ziplibStatus === "D") {
					var raw = fs.createReadStream('./' + configObj.doc_root + requestURL);
					raw.pipe(zlib.createDeflate()).pipe(res);
				} else if (ziplibStatus === "Z") {
					var raw = fs.createReadStream('./' + configObj.doc_root + requestURL);
					raw.pipe(zlib.createGzip()).pipe(res);
				} else {
					var requestData = fs.readFileSync('./' + configObj.doc_root + requestURL);
					res.writeHead(200, {'Content-Type': 'text/html'});
					res.end(requestData);
				}
			}
		}else if (fstat.isDirectory()){
			//Handle Default Page	
			var defaultfstat = fs.statSync('./'+configObj.doc_root+requestURL+"/"+configObj.default_page);
			if (defaultfstat.isFile()){			
				if (ziplibStatus === "D"){
					var raw = fs.createReadStream('./'+configObj.doc_root+requestURL+"/"+configObj.default_page);
					raw.pipe(zlib.createDeflate()).pipe(res);
				}else if (ziplibStatus === "Z"){							
					var raw = fs.createReadStream('./'+configObj.doc_root+requestURL+"/"+configObj.default_page);
					raw.pipe(zlib.createGzip()).pipe(res);
				}else{	
					var requestData = fs.readFileSync('./'+configObj.doc_root+requestURL+"/"+configObj.default_page);
					res.writeHead(200, {'Content-Type': 'text/html'});
					res.end(requestData);
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
			if (fs.existsSync('./'+configObj.api_root+handlerPath+configObj.api_handler_postfix+'.js')) {
				var requestHandler = require('./'+configObj.api_root+handlerPath+configObj.api_handler_postfix+'.js');
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
			res.writeHead(404, {'Content-Type': 'text/html'});
			var requestData = fs.readFileSync('./error/404.html');
			res.end(requestData);
			console.log('request not found :'+req.url);
		}
  }
}).listen(configObj.server_port);
console.log('Server running at http://server_ip_address:'+configObj.server_port);
}

module.exports.start = start;