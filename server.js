
// Including and starting all inclusions
var serverPort = 5000;
var express = require("express");
var app = express()
, session = require('express-session')
, FileStore = require('session-file-store')(session)
, bodyParser = require('body-parser')
, server = require('http').createServer(app)
, fs = require('fs')
, crypto = require('crypto')
, mongoose = require('mongoose').connect('mongodb://localhost:27017/Data-SQL-Tester')


app.use(express.static(__dirname + '/app'));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true}));   // to support URL-encoded bodies
app.use(session({
	genid: function(req) {
		return crypto.randomBytes(48).toString('hex'); // use UUIDs for session IDs
	},
	store: new FileStore,
	secret: 'something', // Change it
	proxy: true,
	resave: true,
	rolling: true,
	saveUninitialized: false,
	cookie: { 
		secure: false,
		// maxAge: 3600000
	}
}))

app.use(function(req,res,next){
		// Website you wish to allow to connect
		res.setHeader('Access-Control-Allow-Origin', '*');
		next();
	});



console.log("[I] Express server started on port " + serverPort + " ...");
console.log("[I] Socket.IO server started on port " + serverPort + "...");

var project = require("./project/app.js");
project(app);

server.listen(serverPort);

// // ======================= MONGODB POOL FUNCTIONS ======================= //

// /** DESCRIBE MODELS **/
// var schema = mongoose.Schema;

// var userSchema = new schema({
// 	userName: String,
// 	password: String, 
// 	fullName: String,
// 	resetPasswordToken: String,
// 	resetPasswordExpires: Date,
// 	isAdmin: Boolean,
// 	profile: {
// 		f_name: String,
// 		l_name: String,
// 		email: String,
// 		major: String,
// 		year: String,
// 		pf_pic: String,
// 		netid: String
// 	},
// 	createdAt: Date,
// });

// // var datasetSchema = new schema({
// // 	heading: String,
// // 	description: String,
// // 	dataSet: String,
// // 	createdBy: {type : schema.ObjectId, ref : 'User'},
// // 	columns: [{
// // 		name: String,
// // 		description: String
// // 	}],
// // 	otherCols: [{
// // 		name: String
// // 	}],
// // 	createdAt: Date,
// // 	deadline: Date,
// // 	plots: [{type : schema.ObjectId, ref : 'Plot'}],
// // });

// // var plotSchema = new schema({
// // 	plot:String,
// // 	forDataset:{type : schema.ObjectId, ref : 'Dataset'},
// // 	submittedBy: {type : schema.ObjectId, ref : 'User'},
// // 	submittedAt: Date,
// // 	published: Boolean,
// // 	publishedBy: {type : schema.ObjectId, ref : 'User'},
// // 	publishedAt: Date,
// // 	caption: String,
// // 	plotType: String,
// // 	xAxis: String,
// // 	yAxis: String,  
// // 	likes: [{type : schema.ObjectId, ref : 'User'}],
// // 	comments: [{
// // 		postedBy: {type : schema.ObjectId, ref : 'User'},
// // 		postedAt: Date,
// // 		text: String,
// // 	}]
// // });

// // plotSchema.index({ caption: 'text', plotType: 'text', xAxis: 'text', yAxis: 'text' });

// // var Dataset = mongoose.model('Dataset', datasetSchema);
// var User = mongoose.model('User', userSchema);
// // var Plot = mongoose.model('Plot', plotSchema);

// // =================== USER =================== //

// /** 
//  * insertUser
//  * Description :
//  *    Insert a new user in the database
//  * Properties :
//  *    @nickname   string    required    username to insert in the db
//  *    @password   string    required    password to insert in the db
//  *    @fullname   string    required    fullname to insert in the db
//  */
// function insertUser(userInfos, callback) {
// 	getUser(userInfos["nickname"], function(err, user) {
// 		if(err) {
// 			return callback(new Error(err));
// 		}
// 		else
// 			if(user !== null) {
// 				return callback(new Error("User already exists"));
// 			}

// 			getUserFromEmail(userInfos["email"].toLowerCase(),function(err, user) {
// 				if(err) {
// 					return callback(new Error(err));
// 				}
// 				else
// 					if(user !== null) {
// 						return callback(new Error("Email already exists"));
// 					} 

// 					var newUser = new User({
// 						userName: userInfos["userName"],
// 						password: userInfos["password"], 
// 						fullName: userInfos["fullName"],
// 						isAdmin: false,
// 						profile: {
// 							f_name: userInfos["f_name"],
// 							l_name: userInfos["l_name"],
// 							email: userInfos["email"].toLowerCase(),
// 							major: userInfos["major"],
// 							year: userInfos["year"],
// 							pf_pic: userInfos["pf_pic"],
// 							netid: userInfos["netid"]
// 						},
// 						createdAt : Date.now(),
// 					});

// 					newUser.save(function(err) {
// 						if(err) { 
// 							return callback(new Error(err)); 
// 						}
// 						return callback(null,true);
// 					});  
// 				});
// 		}); 
// }

// /** 
//  * getUser
//  * Description :
//  *    Get a user from the database
//  * Properties :
//  *    @username   string    required    username to search in the db
//  */
// function getUser(username, callback) {
// 	var selectObj = new Object({
// 		"userName" : 1,
// 		"password" : 1,
// 		"fullName": 1,
// 		"resetPasswordToken": 1,
// 		"resetPasswordExpires": 1,
// 		"isAdmin": 1,
// 	});

// 	User.findOne({userName: username},function(err, userObj) {
// 		if(err) { 
// 			return callback(err);
// 		}
// 		return callback(null, userObj);
// 	}).select(selectObj);
// }

// /** 
//  * getUserFromEmail
//  * Description :
//  *    Get a user's name from the database using email
//  * Properties :
//  *    @email   string    required    username to search in the db
//  */
// function getUserFromEmail(email, callback) {
// 	var selectObj = new Object({
// 		"userName" : 1,
// 	});

// 	User.findOne({"profile.email": email},function(err, userObj) {
// 		if(err) { 
// 			return callback(new Error(err));
// 		}
// 		return callback(null,userObj);
// 	}).select(selectObj);
// }

// /** 
//  * getAllUsers
//  * Description :
//  *    Get all users from the database
//  * Properties :
//  *    @username   string    required    username to search in the db
//  */
// function getAllUsers(callback) {
// 	var selectObj = new Object({
// 		"userName" : 1,
// 		"fullName": 1,
// 		"isAdmin": 1,
// 		"profile" : 1,
// 	});

// 	User.find({},function(err, userObj) {
// 		if(err) { 
// 			return callback(new Error(err));
// 		}

// 		return callback(null,userObj);
// 	}).select(selectObj);
// }

// /** 
//  * getUserProfile
//  * Description :
//  *    Get a user's profile from the database
//  * Properties :
//  *    @username   string    required    username to search in the db
//  */
// function getUserProfile(userID, callback) {
// 	var selectObj = new Object({
// 		"profile" : 1,
// 	});

// 	User.findById(userID, function(err, userObj) {
// 		if(err){ 
// 			return callback(err);
// 		}

// 		return callback(null,userObj);
// 	}).select(selectObj);
// }

// /** 
//  * changePassword
//  * Description :
//  *    Update an existing user's password in the database
//  * Properties :
//  *    @userid     int       required    id of the user to update (from server-side session)
//  *    @nickname   string    required    new username
//  *    @password   string    required    new password
//  *    @fullname   string    required    new fullname
//  */
// function changePassword(userInfos, callback) {
// 	User.update({"userName": userInfos["userName"]},
// 		{"$set": { 
// 			"password": userInfos["password"],
// 			"resetPasswordExpires": Date.now()
// 		}},function(err, retObj) {
// 			if(err) { 
// 				return callback(new Error(err));
// 			}
// 			else
// 				if(retObj.nModified == 0){
// 					return callback(new Error("User does not exist")); 
// 				}

// 				return callback(null, true);
// 			});
// }

// /** 
//  * updateUser
//  * Description :
//  *    Update an existing user in the database
//  * Properties :
//  *    @userid     int       required    id of the user to update (from server-side session)
//  *    @nickname   string    required    new username
//  *    @password   string    required    new password
//  *    @fullname   string    required    new fullname
//  */
// function updateUser(userInfos, callback) {
// 	if(userInfos["pf_pic"]) {
// 		User.update({"_id": userInfos["userId"]},
// 			{"$set": {
// 				"fullName" : userInfos["f_name"] + ' ' + userInfos["l_name"],
// 				"profile.f_name": userInfos["f_name"],
// 				"profile.l_name": userInfos["l_name"],
// 				"profile.email": userInfos["email"],
// 				"profile.major": userInfos["major"],
// 				"profile.year": userInfos["year"],
// 				"profile.pf_pic": userInfos["pf_pic"],
// 				"profile.netid": userInfos["netid"]
// 			}},function(err, retObj){
// 				if(err) { 
// 					return callback(err);
// 				}
// 				else
// 				if(retObj.nModified == 0) {
// 					return callback(new Error("User not found!!!"));
// 				}

// 				return callback(null, true)
// 				});
// 	}
// 	else {
// 		User.update({"_id": userInfos["userId"]},
// 			{"$set": {
// 				"fullName" : userInfos["f_name"] + ' ' + userInfos["l_name"],
// 				"profile.f_name": userInfos["f_name"],
// 				"profile.l_name": userInfos["l_name"],
// 				"profile.email": userInfos["email"],
// 				"profile.major": userInfos["major"],
// 				"profile.year": userInfos["year"],
// 				"profile.netid": userInfos["netid"]
// 			}},function(err, retObj){
// 				if(err){ 
// 					return callback(err);
// 				}
// 				else
// 				if(retObj.nModified == 0) {
// 					return callback(new Error("User not found!!!"));
// 				}
// 				return callback(null,userInfos)
// 			});
// 	}
// }

// /** 
//  * toggleAdminbyID
//  * Description :
//  *    toggles the value of isAdmin
//  * Properties :
//  *   @userID      id        required    id of the user to change
//  */
// function toggleAdminbyID(userID, callback) {
// 	var value = true;
// 	User.findOne({  '_id' : userID },function(err,docs){
// 		if (err){          
// 			return callback(new Error(err));
// 		}
		
// 		value = !docs.isAdmin;

// 		User.update({ '_id' : userID },
// 		{
// 			'$set': {
// 				'isAdmin': value
// 			}},function(err) {
// 				if (err){          
// 					return callback(new Error(JSON.stringify(err)));
// 				}
// 				return callback(null, value);
// 			});
// 	});
// }

// /** 
//  * setPasswordReset
//  * Description :
//  *    Set Password reset token
//  * Properties :
//  *    @userid     int       required    id of the user to update (from server-side session)
//  *    @nickname   string    required    new username
//  *    @password   string    required    new password
//  *    @fullname   string    required    new fullname
//  */
// function setPasswordReset(userInfos, callback) {
// 	User.update({"_id": userInfos["userId"]},
// 		{"$set": {
// 			"resetPasswordToken": userInfos["resetPasswordToken"],
// 			"resetPasswordExpires": userInfos["resetPasswordExpires"]
// 		}},function(err,userObj){
// 		if(err){
// 			return callback(new Error(err));
// 		}

// 		return callback(null, userInfos)
// 	});
// }

// // ======================= DEFINE PASSPORT STRATEGIES ======================= //

// // TODO : handle error if incorrect username
// passport.use('local', new LocalStrategy({
// 	usernameField: 'nickname',
// 	passwordField: 'pwd'
// },function(username, password, done) {
// 	getUser(username,function(err, callback){
// 		if(!callback) return done(null, false, { message: 'Incorrect username.' });
// 		if(!bcrypt.compareSync(password, callback["password"])) return done(null, false, { message: 'Incorrect password.' });
// 		return done(null, callback);
// 	})
// }
// ));

// passport.serializeUser(function(user, done) {
// 	done(null, user);
// });

// passport.deserializeUser(function(user, done) {
// 	done(null, user);
// });



// // ======================= ROUTES ======================= //

// // =================== USER =================== //

// /** 
//  * /reset/:user/:key
//  * METHOD : GET
//  * Description :
//  *    Shows the reset password screen
//  * Body :
//  *    @user   string    required    Required for the user identity
//  *    @key   string    required    Required for the user identity
//  * Return :
//  *    @response   HTML page               
//  **/
// app.get('/reset/:user/:key',function(req,res){

// 	getUser(req.params.user,function(err, callback){
// 		if(err){
// 				var response = {
// 				type: 'reset',
// 				error: '500',
// 				data: err.message
// 			};

// 			return res.end(JSON.stringify(response));
// 		}

// 		pageDisplay = new Object({
// 			user: req.params.user,
// 			key : req.params.key,
// 			qualify: true
// 		});

// 		if(callback == null || !bcrypt.compareSync(req.params.key, callback["resetPasswordToken"])
// 			|| Date.now() > callback["resetPasswordExpires"]){
// 			pageDisplay.qualify = false;
// 		} 

// 		pageDisplay.expiry = callback["resetPasswordExpires"];
// 		res.render('reset.html', pageDisplay);
// 	})  
// });

// /** 
//  * /api/changePassword
//  * METHOD : POST
//  * Description :
//  *    Changes Password of a user 
//  * Body :
//  *    @username   string    required    Required for the user identity
//  *    @password   string    required    Required for the user identity
//  *    @fullname   string    required    Required for the user identity
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/changePassword', function(req, res) {

// 	var response = {
// 		type: 'change',
// 		error: '401',
// 		data: "Argument(s) missing !"
// 	};

// 	console.log(JSON.stringify(req.body));

// 	if(!req.body.nickname || !req.body.resetPasswordToken || !req.body.password){
// 		return res.end(JSON.stringify(response));
// 	} 

// 	userInfos = new Object({
// 		userName : req.body.nickname,
// 		resetPasswordToken : req.body.resetPasswordToken,
// 		password: bcrypt.hashSync(req.body.password,8)
// 	});

// 	getUser(userInfos.userName,function(err, callback){
// 		if(err){
// 			response = {
// 				type: 'change',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}

// 		if(callback == null){
// 			response = {
// 				type: 'change',
// 				error: '400',
// 				data: "User not found"
// 			};
// 			return res.end(JSON.stringify(response));
// 		}

// 		response = {
// 			type: 'change',
// 			error: '400',
// 			data: "Invalid token or expired!!!",
// 		};

// 		if(callback == null
// 			|| !bcrypt.compareSync(userInfos.resetPasswordToken, callback["resetPasswordToken"]) 
// 			|| Date.now() > callback["resetPasswordExpires"]){ 
// 			return res.end(JSON.stringify(response));
// 		}

// 		changePassword(userInfos, function(err, callback) {
// 			if(err){
// 				response = {
// 					type: 'change',
// 					error: '500',
// 					data: err.message,
// 				};
// 			}
			
// 			response = {
// 				type: 'change',
// 				error: '0',
// 				data: callback,
// 			};
			
// 			return res.end(JSON.stringify(response));
// 		});
		
// 	});
// });

// /** 
//  * /api/register
//  * METHOD : POST
//  * Description :
//  *    Register a user in the database
//  * Body :
//  *    @username   string    required    Required for the user identity
//  *    @password   string    required    Required for the user identity
//  *    @fullname   string    required    Required for the user identity
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/register', function(req, res) {

// 	var response = {
// 		type: 'register',
// 		error: '401',
// 		data: "Argument(s) missing !"
// 	};

// 	if(!req.body.nickname || !req.body.pwd || !req.body.fullname){
// 		return res.end(JSON.stringify(response));
// 	}

// 	var fileName = 'default.png'
// 	if(req.body.fileLocation){
// 		fileName = req.body.nickname + '.' + req.body.fileLocation.split('.')[1];
		
// 		fs.readFile(req.body.fileLocation, function (err, data) {
// 			if(err){
// 				response = {
// 					type: 'register',
// 					error: '500',
// 					data: err.message
// 				};
// 				return res.end(JSON.stringify(response));
// 			}
			
// 			var newPath = __dirname + "/profiles/" + fileName;
// 			fs.writeFile(newPath, data, function (err) {
// 				if(err){
// 					response = {
// 						type: 'register',
// 						error: '500',
// 						data: err.message
// 					};
// 					return res.end(JSON.stringify(response));
// 				}
// 			});
// 		});
// 	}

// 	userInfos = new Object({
// 		userName: req.body.nickname,
// 		password: bcrypt.hashSync(req.body.pwd, 8), //Encrypt with bcryptjs
// 		fullName: req.body.fullname,
// 		f_name: req.body.f_name,
// 		l_name: req.body.l_name,
// 		email: req.body.email,
// 		major: req.body.major,
// 		year: req.body.year,
// 		netid: req.body.netid,
// 		pf_pic: fileName,
// 	});

// 	insertUser(userInfos, function(err, cb){
// 		if(err){
// 			response = {
// 				type: 'register',
// 				error: '500',
// 				data: err.message
// 			};
// 		}
// 		response = {
// 			type: 'register',
// 			error: '0',
// 			data: cb,
// 			message: "Registration successful!!!"
// 		};
// 		return res.end(JSON.stringify(response));
// 	})
// });

// /** 
//  * /api/login
//  * METHOD : POST
//  * Description :
//  *    Verify user credentials and create a server-based session
//  * Body :
//  *    @username   string    required    Required for the user identity
//  *    @password   string    required    Required for the user identity
//  * Return :
//  *    @response   object                User informations (fullname, ...) for the client-side
//  **/
// app.post('/api/login', function(req, res, next) {
// 	passport.authenticate('local', function(err, user, info) {

// 		if (err) { 
// 			response = {
// 				type: 'login',
// 				error: '500',
// 				data: err.message
// 			};
// 			res.end(JSON.stringify(response)); 
// 		}
// 		if(info){
// 			response = {
// 				type: 'login',
// 				error: '400',
// 				data: info.message
// 			};
// 			res.end(JSON.stringify(response));
// 		}

// 		req.login(user, function(err) {
// 			if (err) { 
// 				response = {
// 					type: 'login',
// 					error: '500',
// 					data: err.message
// 				};
// 				res.end(JSON.stringify(response)); 
// 			}

// 			response = {
// 				type: 'login',
// 				error: '0',
// 				data: user,
// 				message: "Login successful!!!"
// 			};

// 			res.end(JSON.stringify(response)); 
// 		});
		
// 	})(req, res, next);
// });

// /** 
//  * /api/forgot
//  * METHOD : POST
//  * Description :
//  *    Send Mail to the user with registered e-mail to reset the password
//  * Body :
//  *    @email   string    required    Required for the user identity
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/forgot', function(req, res) {
// 	var response = {
// 		type: 'forgot',
// 		error: '401',
// 		data: "Argument(s) missing !"
// 	};

// 	if(!req.body.email) return res.end(JSON.stringify(response));

// 	userInfos = new Object({
// 		email: req.body.email
// 	});

// 	getUserFromEmail(userInfos.email, function(err, cb){
// 		if(err){
// 			var response = {
// 				type: 'forgot',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}
		
// 		if(cb == null){
// 			var response = {
// 				type: 'forgot',
// 				error: '400',
// 				data: "User with this email does not exist!!!"
// 			};
// 			return res.end(JSON.stringify(response));
// 		}
				
// 		var userToken = crypto.randomBytes(10).toString('hex');
// 		var Tokenexpiry = new Date(Date.now() + 3600000); //1 hour


// 		uInfo = new Object({
// 			userId: cb._id,
// 			userName : cb.userName,
// 			resetPasswordToken: bcrypt.hashSync(userToken,8),
// 			resetPasswordExpires: Tokenexpiry
// 		});

// 		setPasswordReset(uInfo,function(err, cb){
// 			if(err){
// 				var response = {
// 					type: 'forgot',
// 					error: '500',
// 					data: err.message
// 				};

// 				return res.end(JSON.stringify(response));
// 			}

// 			var mailOptions = {
// 				from: '"Data Puzzle" <no-reply@datapuzzle.com>', // sender address
// 				to: userInfos.email, // list of receivers
// 				subject: 'Change Password link', // Subject line
// 				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
// 				'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
// 				'http://' + req.headers.host + '/reset/' + uInfo.userName + '/' + userToken + '\n\n' +
// 				'If you did not request this, please ignore this email and your password will remain unchanged.\n'
// 			};

// 			//send mail with defined transport object
// 			transporter.sendMail(mailOptions, function(err, info){
// 				if(err){
// 					var response = {
// 						type: 'forgot',
// 						error: '500',
// 						data: err.message
// 					};

// 					return res.end(JSON.stringify(response));
// 				}
// 				console.log('Message sent: ' + info.response);

// 				response = {
// 					type: 'forgot',
// 					error: '0',
// 					data: info
// 				};
// 				return res.end(JSON.stringify(response));
// 			});     
// 		});
// 	})
// });

 
//  * /api/uploadImage
//  * METHOD : POST
//  * Description :
//  *    Temporarily upload the display pictures
//  * Return :
//  *    @response   object                User informations (fullname, ...) for the client-side
//  *
// app.post('/api/uploadImage', function(req,res) {

// 	var response = {
// 		type: 'uploadImage',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};



// 	uploadTemp(req,res,function(err) {
// 		response = {
// 			type: 'uploadImage',
// 			error: '500',
// 			data: 'Error Uploading File!'
// 		};
// 		if(err) {
// 			res.status(500).end(JSON.stringify(response));
// 		}
		
// 		var patt = new RegExp("^image\/");

// 		if(!patt.test(req.file.mimetype)){
// 				response = {
// 				type: 'uploadImage',
// 				error: '400',
// 				data: 'Invalid File format'
// 			};
// 			res.status(400).end(JSON.stringify(response));
// 		}

// 		response = {
// 			type: 'uploadImage',
// 			error: '0',
// 			data: req.file
// 		};
// 		res.end(JSON.stringify(response));
// 	});
// });

// // ======================= LOGGED IN ROUTES ======================= //

// // =================== USER =================== //

// /** 
//  * /api/profile
//  * METHOD : POST
//  * Description :
//  *    Get profile of the user
//  * Body :
//  *    @username   string    required    Required for the user identity
//  *    @password   string    required    Required for the user identity
//  *    @fullname   string    required    Required for the user identity
//  * Return :
//  *    @response   object               
//  *
// app.post('/api/profile', function(req, res) {

// 	var response = {
// 		type: 'profile',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};
// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'profile',
// 		error: '401',
// 		data: "Argument(s) missing !"
// 	};

// 	if(!req.user._id) return res.end(JSON.stringify(response));

// 	getUserProfile(req.user._id,function(err, callback){
// 		if(err){
// 			response = {
// 				type: 'profile',
// 				error: '500',
// 				data: err.message,
// 			};
// 			return res.end(JSON.stringify(response));  
// 		}
// 		response = {
// 			type: 'profile',
// 			error: '0',
// 			data: callback.profile,
// 		};
// 		return res.end(JSON.stringify(response));
// 	});
// });

// /** 
//  * /api/userProfile
//  * METHOD : POST
//  * Description :
//  *    Get profile of the user
//  * Body :
//  *    @username   string    required    Required for the user identity
//  *    @password   string    required    Required for the user identity
//  *    @fullname   string    required    Required for the user identity
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/userProfile', function(req, res) {

// 	var response = {
// 		type: 'userProfile',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};
// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'userProfile',
// 		error: '401',
// 		data: "Argument(s) missing !"
// 	};

// 	if(!req.body.userId) return res.end(JSON.stringify(response));

// 	getUserProfile(req.body.userId,function(err, callback){
// 		if(err){
// 			response = {
// 				type: 'userProfile',
// 				error: '500',
// 				data: err.message,
// 			};
// 			return res.end(JSON.stringify(response));  
// 		}
// 		response = {
// 			type: 'userProfile',
// 			error: '0',
// 			data: callback.profile,
// 		};
// 		return res.end(JSON.stringify(response));
// 	});
// });

// /** 
//  * /api/update
//  * METHOD : POST
//  * Description :
//  *    Update the user profile (according the server-session) in the database
//  * Body :
//  *    @username   string    required    Required for the user identity
//  *    @password   string    required    Required for the user identity
//  *    @fullname   string    required    Required for the user identity
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/update', function(req, res) {
// 	var response = {
// 		type: 'update',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()){ console.log('Not logged!!!'); return res.end(JSON.stringify(response));}

// 	if(!req.body.f_name || !req.body.l_name || !req.body.email || !req.body.major 
// 		|| !req.body.year || !req.body.netid){
// 		response = {
// 			type: 'update',
// 			error: '401',
// 			data: "Argument(s) missing !"
// 		};
// 		return res.end(JSON.stringify(response));
// 	}

// 	var fileName = null;
// 	if(req.body.fileLocation != ""){
// 		fileName = req.body.nickname + '.' + req.body.fileLocation.split('.')[1];

// 		fs.readFile(req.body.fileLocation, function (err, data) {
// 			if(err){
// 				response = {
// 					type: 'update',
// 					error: '500',
// 					data: err.message
// 				};
// 				return res.end(JSON.stringify(response));
// 			}

// 			var newPath = __dirname + "/profiles/" + fileName;
// 			fs.writeFile(newPath, data, function (err) {
// 				if(err){
// 					response = {
// 						type: 'update',
// 						error: '500',
// 						data: err.message
// 					};
// 					return res.end(JSON.stringify(response));
// 				}
// 			});
// 		});
// 	}

// 	userInfos = new Object({
// 		userId: req.user._id,
// 		f_name: req.body.f_name,
// 		l_name: req.body.l_name,
// 		email: req.body.email,
// 		major: req.body.major,
// 		year: req.body.year,
// 		pf_pic: fileName,
// 		netid: req.body.netid
// 	});

// 	updateUser(userInfos, function(err, cb){
// 		if(err){
// 			response = {
// 				type: 'update',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}

// 		response = {
// 			type: 'update',
// 			error: '0',
// 			data: cb,
// 			message: "Update successful!!!"
// 		};
// 		return res.end(JSON.stringify(response));
// 	})
// });

// /** 
//  * /api/getUsers
//  * METHOD : GET
//  Description :
//  *    Returns all the datasets from the database
//  * Return :
//  *    @response   object               
//  **/
// app.get('/api/getUsers', function(req,res) {

// 	var response = {
// 		type: 'getUsers',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	getAllUsers(function(err, cb){
// 		if(err){
// 			response = {
// 				type: 'getUsers',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}

// 		response = {
// 			type: 'getUsers',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/toggleAdmin
//  * METHOD : POST
//  Description :
//  *    Toggles the value published
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/toggleAdmin', function(req,res) {

// 	var response = {
// 		type: 'toggleAdmin',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'toggleAdmin',
// 		error: '400',
// 		data: 'Insufficient privileges!!!'
// 	};

// 	if(!req.user.isAdmin){
// 		return res.end(JSON.stringify(response));
// 	}
	
// 	toggleAdminbyID(req.body.userID, function(err, cb) {
// 		if(err){
// 			response = {
// 				type: 'toggleAdmin',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response))
// 		}
// 		response = {
// 			type: 'toggleAdmin',
// 			error: '0',
// 			data: cb
// 		};
// 		return res.end(JSON.stringify(response)) 
// 	});
// });

// /** 
//  * /api/pic/:name
//  * METHOD : GET
//  * Description :
//  *    send Image
//  * Return :
//  *    @response   object                User informations (fullname, ...) for the client-side
//  **/
// app.get('/api/pic/:name', function (req, res, next) {

// 	var response = {
// 		type: 'pic',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	var options = {
// 		root: __dirname + '/profiles/',
// 		dotfiles: 'deny',
// 		headers: {
// 			'x-timestamp': Date.now(),
// 			'x-sent': true
// 		}
// 	};

// 	var fileName = req.params.name;
// 	if(fileName == ""){
// 		fileName = "default.png"
// 	}
// 	res.sendFile(fileName, options, function (err) {
// 		if (err) {
// 			console.log(err);
// 			return res.status(err.status).end();
// 		}
// 		console.log('Sent:', fileName);
// 	});
// });

// /** 
//  * /api/checkLogin
//  * METHOD : GET
//  Description :
//  *    Check the login
//  * Return :
//  *    @response   object               
//  **/
// app.get('/api/checkLogin', function(req,res){

// 	var response = {
// 		type: 'postComment',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(req.isAuthenticated()){
// 		response = {
// 			type: 'postComment',
// 			error: '0',
// 			data: 'Logged In : ' + req.user.userName,
// 		};
// 	}

// 	return res.end(JSON.stringify(response)) 
// });

// /** 
//  * /api/logout
//  * METHOD : GET
//  * Description :
//  *    Log out the user by destroying his session
//  * Return :
//  *    @response   object                User informations (fullname, ...) for the client-side
//  **/
// app.get('/api/logout', function(req,res) {
// 	req.logout();

// 	var response = {
// 		type: 'logout',
// 		error: '0',
// 		data: ''
// 	};

// 	return res.end(JSON.stringify(response))
// });