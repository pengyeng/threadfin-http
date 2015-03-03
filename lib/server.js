var http = require('http');
var fs = require('fs');

var configData = fs.readFileSync('./config.json'),configObj;

try {
    configObj = JSON.parse(configData);
}catch (err) {
    console.log('There has been an error parsing your JSON.')
    console.log(err);
}

http.createServer(function (req, res) {	
  console.log(req.url);		 
  requestURL = req.url;
  try{
	
	//Security Realm
	//res.writeHead(401, {
    //  'WWW-Authenticate': 'Basic realm="Security Realm"'
    //});
    //res.end();
	
	//Handle HTML content
	if (fs.existsSync('./'+configObj.doc_root+requestURL)) {
		var requestData = fs.readFileSync('./'+configObj.doc_root+requestURL);
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(requestData);
	}else{		
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
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end("Page Not Found");
			console.log('request not found :'+req.url);		
		}
	}	
  }catch(err){
		try{
			//Handle Default Page	
			var requestData = fs.readFileSync('./'+configObj.doc_root+requestURL+"/"+configObj.default_page);
			res.end(requestData);
		}catch(err){
			//Handle Page Not Found	
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end("Page Not Found");
			console.log('request not found :'+req.url);
		}
  }
}).listen(configObj.server_port);
console.log('Server running at http://server_ip_address:'+configObj.server_port);