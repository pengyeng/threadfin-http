var fs = require('fs');
var securityObj;

function load(config_path){

	var configData = fs.readFileSync(config_path);
	securityObj = JSON.parse(configData);
}

function authenticate(id,password){
	
	//reading User Repository from security.json 
	console.log(securityObj);
	for (var i=0; i<securityObj.users.length; i++) {
		var acl = securityObj.users[i];
		if ((acl.user.id == id) && (acl.user.password == password)){
			return true;
		}
	}
	
	return false;
	
}

function protectedzone(path){
	//reading User Repository from security.json 

	for (var i=0; i<securityObj.acl.length; i++) {
		var protectedPattern = securityObj.acl[i].pattern;	
		var found = path.search(protectedPattern);		
		if (found >=0){
			return true;
		}
	}
	return false;
}
module.exports.load = load;
module.exports.authenticate = authenticate;
module.exports.protectedzone = protectedzone;