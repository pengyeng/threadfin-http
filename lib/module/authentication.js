
	
function authenticate(id,password){
	
	//reading User Repository from security.json 
	var securityObj = require('./../security.json');

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
	var securityObj = require('./../security.json');
	for (var i=0; i<securityObj.acl.length; i++) {
		var protectedPattern = securityObj.acl[i].pattern;	
		var found = path.search(protectedPattern);		
		if (found >=0){
			return true;
		}
	}
	return false;
}
module.exports.authenticate = authenticate;
module.exports.protectedzone = protectedzone;