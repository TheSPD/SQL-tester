module.exports = function() {

	var mongoose = require("mongoose")
	var UserSchema = require("./user.schema.server")();
	var User = mongoose.model("User", UserSchema);

	

	var api = {
		insertUser: insertUser,
		getUser: getUser,
		getUserFromEmail: getUserFromEmail,
		getAllUsers: getAllUsers,
		getUserProfile: getUserProfile,
		changePassword: changePassword,
		updateUser: updateUser,
		toggleAdminbyID:toggleAdminbyID,
		setPasswordReset:setPasswordReset,
	};
	return api;

		// =================== USER =================== //

	/** 
	 * insertUser
	 * Description :
	 *    Insert a new user in the database
	 * Properties :
	 *    @nickname   string    required    username to insert in the db
	 *    @password   string    required    password to insert in the db
	 *    @fullname   string    required    fullname to insert in the db
	 */
	 function insertUser(userInfos, callback) {
	 	getUser(userInfos["nickname"], function(err, user) {
	 		if(err) {
	 			return callback(new Error(err));
	 		}
	 		else
	 			if(user !== null) {
	 				return callback(new Error("User already exists"));
	 			}

	 			getUserFromEmail(userInfos["email"].toLowerCase(),function(err, user) {
	 				if(err) {
	 					return callback(new Error(err));
	 				}
	 				else
	 					if(user !== null) {
	 						return callback(new Error("Email already exists"));
	 					} 

	 					var newUser = new User({
	 						userName: userInfos["userName"],
	 						password: userInfos["password"], 
	 						fullName: userInfos["fullName"],
	 						isAdmin: false,
	 						profile: {
	 							f_name: userInfos["f_name"],
	 							l_name: userInfos["l_name"],
	 							email: userInfos["email"].toLowerCase(),
	 							major: userInfos["major"],
	 							year: userInfos["year"],
	 							pf_pic: userInfos["pf_pic"],
	 							netid: userInfos["netid"]
	 						},
	 						createdAt : Date.now(),
	 					});

	 					newUser.save(function(err) {
	 						if(err) { 
	 							return callback(new Error(err)); 
	 						}
	 						return callback(null,true);
	 					});  
	 				});
	 		}); 
	 }

	/** 
	 * getUser
	 * Description :
	 *    Get a user from the database
	 * Properties :
	 *    @username   string    required    username to search in the db
	 */
	 function getUser(username, callback) {
	 	var selectObj = new Object({
	 		"userName" : 1,
	 		"password" : 1,
	 		"fullName": 1,
	 		"resetPasswordToken": 1,
	 		"resetPasswordExpires": 1,
	 		"isAdmin": 1,
	 	});

	 	User.findOne({userName: username},function(err, userObj) {
	 		if(err) { 
	 			return callback(err);
	 		}
	 		return callback(null, userObj);
	 	}).select(selectObj);
	 }

	/** 
	 * getUserFromEmail
	 * Description :
	 *    Get a user's name from the database using email
	 * Properties :
	 *    @email   string    required    username to search in the db
	 */
	 function getUserFromEmail(email, callback) {
	 	var selectObj = new Object({
	 		"userName" : 1,
	 	});

	 	User.findOne({"profile.email": email},function(err, userObj) {
	 		if(err) { 
	 			return callback(new Error(err));
	 		}
	 		return callback(null,userObj);
	 	}).select(selectObj);
	 }

	/** 
	 * getAllUsers
	 * Description :
	 *    Get all users from the database
	 * Properties :
	 *    @username   string    required    username to search in the db
	 */
	 function getAllUsers(callback) {
	 	var selectObj = new Object({
	 		"userName" : 1,
	 		"fullName": 1,
	 		"isAdmin": 1,
	 		"profile" : 1,
	 	});

	 	User.find({},function(err, userObj) {
	 		if(err) { 
	 			return callback(new Error(err));
	 		}

	 		return callback(null,userObj);
	 	}).select(selectObj);
	 }

	/** 
	 * getUserProfile
	 * Description :
	 *    Get a user's profile from the database
	 * Properties :
	 *    @username   string    required    username to search in the db
	 */
	 function getUserProfile(userID, callback) {
	 	var selectObj = new Object({
	 		"profile" : 1,
	 	});

	 	User.findById(userID, function(err, userObj) {
	 		if(err){ 
	 			return callback(err);
	 		}

	 		return callback(null,userObj);
	 	}).select(selectObj);
	 }

	/** 
	 * changePassword
	 * Description :
	 *    Update an existing user's password in the database
	 * Properties :
	 *    @userid     int       required    id of the user to update (from server-side session)
	 *    @nickname   string    required    new username
	 *    @password   string    required    new password
	 *    @fullname   string    required    new fullname
	 */
	 function changePassword(userInfos, callback) {
	 	User.update({"userName": userInfos["userName"]},
	 		{"$set": { 
	 			"password": userInfos["password"],
	 			"resetPasswordExpires": Date.now()
	 		}},function(err, retObj) {
	 			if(err) { 
	 				return callback(new Error(err));
	 			}
	 			else
	 				if(retObj.nModified == 0){
	 					return callback(new Error("User does not exist")); 
	 				}

	 				return callback(null, true);
	 			});
	 }

	/** 
	 * updateUser
	 * Description :
	 *    Update an existing user in the database
	 * Properties :
	 *    @userid     int       required    id of the user to update (from server-side session)
	 *    @nickname   string    required    new username
	 *    @password   string    required    new password
	 *    @fullname   string    required    new fullname
	 */
	 function updateUser(userInfos, callback) {
	 	if(userInfos["pf_pic"]) {
	 		User.update({"_id": userInfos["userId"]},
	 			{"$set": {
	 				"fullName" : userInfos["f_name"] + ' ' + userInfos["l_name"],
	 				"profile.f_name": userInfos["f_name"],
	 				"profile.l_name": userInfos["l_name"],
	 				"profile.email": userInfos["email"],
	 				"profile.major": userInfos["major"],
	 				"profile.year": userInfos["year"],
	 				"profile.pf_pic": userInfos["pf_pic"],
	 				"profile.netid": userInfos["netid"]
	 			}},function(err, retObj){
	 				if(err) { 
	 					return callback(err);
	 				}
	 				else
	 					if(retObj.nModified == 0) {
	 						return callback(new Error("User not found!!!"));
	 					}

	 					return callback(null, true)
	 				});
	 	}
	 	else {
	 		User.update({"_id": userInfos["userId"]},
	 			{"$set": {
	 				"fullName" : userInfos["f_name"] + ' ' + userInfos["l_name"],
	 				"profile.f_name": userInfos["f_name"],
	 				"profile.l_name": userInfos["l_name"],
	 				"profile.email": userInfos["email"],
	 				"profile.major": userInfos["major"],
	 				"profile.year": userInfos["year"],
	 				"profile.netid": userInfos["netid"]
	 			}},function(err, retObj){
	 				if(err){ 
	 					return callback(err);
	 				}
	 				else
	 					if(retObj.nModified == 0) {
	 						return callback(new Error("User not found!!!"));
	 					}
	 					return callback(null,userInfos)
	 				});
	 	}
	 }

	/** 
	 * toggleAdminbyID
	 * Description :
	 *    toggles the value of isAdmin
	 * Properties :
	 *   @userID      id        required    id of the user to change
	 */
	 function toggleAdminbyID(userID, callback) {
	 	var value = true;
	 	User.findOne({  '_id' : userID },function(err,docs){
	 		if (err){          
	 			return callback(new Error(err));
	 		}
	 		
	 		value = !docs.isAdmin;

	 		User.update({ '_id' : userID },
	 		{
	 			'$set': {
	 				'isAdmin': value
	 			}},function(err) {
	 				if (err){          
	 					return callback(new Error(JSON.stringify(err)));
	 				}
	 				return callback(null, value);
	 			});
	 	});
	 }

	/** 
	 * setPasswordReset
	 * Description :
	 *    Set Password reset token
	 * Properties :
	 *    @userid     int       required    id of the user to update (from server-side session)
	 *    @nickname   string    required    new username
	 *    @password   string    required    new password
	 *    @fullname   string    required    new fullname
	 */
	 function setPasswordReset(userInfos, callback) {
	 	User.update({"_id": userInfos["userId"]},
	 		{"$set": {
	 			"resetPasswordToken": userInfos["resetPasswordToken"],
	 			"resetPasswordExpires": userInfos["resetPasswordExpires"]
	 		}},function(err,userObj){
	 			if(err){
	 				return callback(new Error(err));
	 			}

	 			return callback(null, userInfos)
	 		});
	 }

}

