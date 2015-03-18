
	
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

module.exports.authenticate = authenticate;