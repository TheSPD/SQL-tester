var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var multer = require('multer');
var nodemailer = require('nodemailer');
var  crypto = require('crypto');

module.exports = function(app,models){

	var userModel = models.userModel;

	var storageTemp =   multer.diskStorage({
		destination: function (req, file, callback) {
			callback(null, './uploads/tmp');
		},
		filename: function (req, file, callback) {
			var tmpName = file.originalname.split('.');

			callback(null, tmpName[0] + '-' + Date.now() + '.' + tmpName[tmpName.length-1]);
		}
	});
	var uploadTemp = multer({ storage : storageTemp}).single('file');

	var transporter = nodemailer.createTransport({
		service: 'Mailgun', // no need to set host or port etc.
		auth: {
			user: 'postmaster@sandboxef7ea56d7d9e444ca7c5787f190d0bd4.mailgun.org',
			pass: '24a1c9d57a4b888eed205bd1e5f6b18b'
		}
	});

	app.use(passport.initialize());
	app.use(passport.session());

	// ======================= ROUTES ======================= //

	app.get('/reset/:user/:key', reset);
	app.post('/api/changePassword', changePassword);
	app.post('/api/register', register);
	app.post('/api/login', login);
	app.post('/api/forgot', forgot);
	app.post('/api/uploadImage', uploadImage);

	// ======================= LOGGED IN ROUTES ======================= //

	app.post('/api/profile', profile);
	app.post('/api/userProfile', userProfile);
	app.post('/api/update', update);
	app.get('/api/getUsers', getUsers);
	app.post('/api/toggleAdmin', toggleAdmin);
	app.get('/api/pic/:name', pic);
	app.get('/api/logout', logout);

	// =================== USER =================== //

	/** 
	* reset()
	* METHOD : GET
	* Description :
	*    Shows the reset password screen
	* Body :
	*    @user   string    required    Required for the user identity
	*    @key   string    required    Required for the user identity
	* Return :
	*    @response   HTML page               
	**/
	function reset(req,res){

		userModel.getUser(req.params.user,function(err, callback){
			if(err){
				var response = {
					type: 'reset',
					error: '500',
					data: err.message
				};

				return res.end(JSON.stringify(response));
			}

			pageDisplay = new Object({
				user: req.params.user,
				key : req.params.key,
				qualify: true
			});

			if(callback == null || !bcrypt.compareSync(req.params.key, callback["resetPasswordToken"])
				|| Date.now() > callback["resetPasswordExpires"]){
				pageDisplay.qualify = false;
		}

		pageDisplay.expiry = callback["resetPasswordExpires"];
		res.render('reset.html', pageDisplay);
	})  
	}

	/** 
	* changePassword
	* METHOD : POST
	* Description :
	*    Changes Password of a user 
	* Body :
	*    @username   string    required    Required for the user identity
	*    @password   string    required    Required for the user identity
	*    @fullname   string    required    Required for the user identity
	* Return :
	*    @response   object               
	**/
	function changePassword(req, res) {

		var response = {
			type: 'change',
			error: '401',
			data: "Argument(s) missing !"
		};

		console.log(JSON.stringify(req.body));

		if(!req.body.nickname || !req.body.resetPasswordToken || !req.body.password){
			return res.end(JSON.stringify(response));
		} 

		userInfos = new Object({
			userName : req.body.nickname,
			resetPasswordToken : req.body.resetPasswordToken,
			password: bcrypt.hashSync(req.body.password,8)
		});

		userModel.getUser(userInfos.userName,function(err, callback){
			if(err){
				response = {
					type: 'change',
					error: '500',
					data: err.message
				};
				return res.end(JSON.stringify(response));
			}

			if(callback == null){
				response = {
					type: 'change',
					error: '400',
					data: "User not found"
				};
				return res.end(JSON.stringify(response));
			}

			response = {
				type: 'change',
				error: '400',
				data: "Invalid token or expired!!!",
			};

			if(callback == null || !bcrypt.compareSync(userInfos.resetPasswordToken, callback["resetPasswordToken"]) || Date.now() > callback["resetPasswordExpires"]) { 
					return res.end(JSON.stringify(response));
			}

			changePassword(userInfos, function(err, callback) {
				if(err){
					response = {
						type: 'change',
						error: '500',
						data: err.message,
					};
				}

				response = {
					type: 'change',
					error: '0',
					data: callback,
				};

				return res.end(JSON.stringify(response));
			});

		});
	}

	/** 
	 * register
	 * METHOD : POST
	 * Description :
	 *    Register a user in the database
	 * Body :
	 *    @username   string    required    Required for the user identity
	 *    @password   string    required    Required for the user identity
	 *    @fullname   string    required    Required for the user identity
	 * Return :
	 *    @response   object               
	 **/
	function register(req, res) {

	 	var response = {
	 		type: 'register',
	 		error: '401',
	 		data: "Argument(s) missing !"
	 	};

	 	if(!req.body.nickname || !req.body.pwd || !req.body.fullname){
	 		return res.end(JSON.stringify(response));
	 	}

	 	var fileName = 'default.png'
	 	if(req.body.fileLocation){
	 		fileName = req.body.nickname + '.' + req.body.fileLocation.split('.')[1];

	 		fs.readFile(req.body.fileLocation, function (err, data) {
	 			if(err){
	 				response = {
	 					type: 'register',
	 					error: '500',
	 					data: err.message
	 				};
	 				return res.end(JSON.stringify(response));
	 			}

	 			var newPath = __dirname + "/../../profiles/" + fileName;
	 			fs.writeFile(newPath, data, function (err) {
	 				if(err){
	 					response = {
	 						type: 'register',
	 						error: '500',
	 						data: err.message
	 					};
	 					return res.end(JSON.stringify(response));
	 				}
	 			});
	 		});
	 	}

	 	userInfos = new Object({
	 		userName: req.body.nickname,
			password: bcrypt.hashSync(req.body.pwd, 8), //Encrypt with bcryptjs
			fullName: req.body.fullname,
			f_name: req.body.f_name,
			l_name: req.body.l_name,
			email: req.body.email,
			major: req.body.major,
			year: req.body.year,
			netid: req.body.netid,
			pf_pic: fileName,
		});

	 	userModel.insertUser(userInfos, function(err, cb){
	 		if(err){
	 			response = {
	 				type: 'register',
	 				error: '500',
	 				data: err.message
	 			};
	 		}
	 		response = {
	 			type: 'register',
	 			error: '0',
	 			data: cb,
	 			message: "Registration successful!!!"
	 		};
	 		return res.end(JSON.stringify(response));
	 	})
	 }

	/** 
	 * login
	 * METHOD : POST
	 * Description :
	 *    Verify user credentials and create a server-based session
	 * Body :
	 *    @username   string    required    Required for the user identity
	 *    @password   string    required    Required for the user identity
	 * Return :
	 *    @response   object                User informations (fullname, ...) for the client-side
	 **/
	function login(req, res, next) {
	 	passport.authenticate('local', function(err, user, info) {

	 		if (err) { 
	 			response = {
	 				type: 'login',
	 				error: '500',
	 				data: err.message
	 			};
	 			console.log('Here!!');
	 			res.end(JSON.stringify(response)); 
	 		}
	 		if(info){
	 			response = {
	 				type: 'login',
	 				error: '400',
	 				data: info.message
	 			};
	 			res.end(JSON.stringify(response));
	 		}

	 		req.login(user, function(err) {
	 			if (err) { 
	 				response = {
	 					type: 'login',
	 					error: '500',
	 					data: err.message
	 				};
	 				res.end(JSON.stringify(response)); 
	 			}

	 			response = {
	 				type: 'login',
	 				error: '0',
	 				data: user,
	 				message: "Login successful!!!"
	 			};

	 			res.end(JSON.stringify(response)); 
	 		});

	 	})(req, res, next);
	 }

	/** 
	 * forgot
	 * METHOD : POST
	 * Description :
	 *    Send Mail to the user with registered e-mail to reset the password
	 * Body :
	 *    @email   string    required    Required for the user identity
	 * Return :
	 *    @response   object               
	 **/
	function forgot(req, res) {
	 	var response = {
	 		type: 'forgot',
	 		error: '401',
	 		data: "Argument(s) missing !"
	 	};

	 	if(!req.body.email) return res.end(JSON.stringify(response));

	 	userInfos = new Object({
	 		email: req.body.email
	 	});

	 	userModel.getUserFromEmail(userInfos.email, function(err, cb){
	 		if(err){
	 			var response = {
	 				type: 'forgot',
	 				error: '500',
	 				data: err.message
	 			};
	 			return res.end(JSON.stringify(response));
	 		}

	 		if(cb == null){
	 			var response = {
	 				type: 'forgot',
	 				error: '400',
	 				data: "User with this email does not exist!!!"
	 			};
	 			return res.end(JSON.stringify(response));
	 		}

	 		var userToken = crypto.randomBytes(10).toString('hex');
			var Tokenexpiry = new Date(Date.now() + 3600000); //1 hour


			uInfo = new Object({
				userId: cb._id,
				userName : cb.userName,
				resetPasswordToken: bcrypt.hashSync(userToken,8),
				resetPasswordExpires: Tokenexpiry
			});

			userModel.setPasswordReset(uInfo,function(err, cb){
				if(err){
					var response = {
						type: 'forgot',
						error: '500',
						data: err.message
					};

					return res.end(JSON.stringify(response));
				}

				var mailOptions = {
					from: '"Data Puzzle" <no-reply@datapuzzle.com>', // sender address
					to: userInfos.email, // list of receivers
					subject: 'Change Password link', // Subject line
					text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					'http://' + req.headers.host + '/reset/' + uInfo.userName + '/' + userToken + '\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};

				//send mail with defined transport object
				transporter.sendMail(mailOptions, function(err, info){
					if(err){
						var response = {
							type: 'forgot',
							error: '500',
							data: err.message
						};

						return res.end(JSON.stringify(response));
					}
					console.log('Message sent: ' + info.response);

					response = {
						type: 'forgot',
						error: '0',
						data: info
					};
					return res.end(JSON.stringify(response));
				});     
			});
		})
	 }

	/** 
	 * uploadImage
	 * METHOD : POST
	 * Description :
	 *    Temporarily upload the display pictures
	 * Return :
	 *    @response   object                User informations (fullname, ...) for the client-side
	 **/
	function uploadImage(req,res) {

	 	var response = {
	 		type: 'uploadImage',
	 		error: '403',
	 		data: "Access forbidden : user not logged."
	 	};



	 	uploadTemp(req,res,function(err) {
	 		response = {
	 			type: 'uploadImage',
	 			error: '500',
	 			data: 'Error Uploading File!'
	 		};
	 		if(err) {
	 			res.status(500).end(JSON.stringify(response));
	 		}

	 		var patt = new RegExp("^image\/");

	 		if(!patt.test(req.file.mimetype)){
	 			response = {
	 				type: 'uploadImage',
	 				error: '400',
	 				data: 'Invalid File format'
	 			};
	 			res.status(400).end(JSON.stringify(response));
	 		}

	 		response = {
	 			type: 'uploadImage',
	 			error: '0',
	 			data: req.file
	 		};
	 		res.end(JSON.stringify(response));
	 	});
	}

	/** 
	 * profile
	 * METHOD : POST
	 * Description :
	 *    Get profile of the user
	 * Body :
	 *    @username   string    required    Required for the user identity
	 *    @password   string    required    Required for the user identity
	 *    @fullname   string    required    Required for the user identity
	 * Return :
	 *    @response   object               
	 **/
	function profile(req, res) {

	 	var response = {
	 		type: 'profile',
	 		error: '403',
	 		data: "Access forbidden : user not logged."
	 	};
	 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

	 	response = {
	 		type: 'profile',
	 		error: '401',
	 		data: "Argument(s) missing !"
	 	};

	 	if(!req.user._id) return res.end(JSON.stringify(response));

	 	userModel.getUserProfile(req.user._id,function(err, callback){
	 		if(err){
	 			response = {
	 				type: 'profile',
	 				error: '500',
	 				data: err.message,
	 			};
	 			return res.end(JSON.stringify(response));  
	 		}
	 		response = {
	 			type: 'profile',
	 			error: '0',
	 			data: callback.profile,
	 		};
	 		return res.end(JSON.stringify(response));
	 	});
	}

	/** 
	 * userProfile
	 * METHOD : POST
	 * Description :
	 *    Get profile of the user
	 * Body :
	 *    @username   string    required    Required for the user identity
	 *    @password   string    required    Required for the user identity
	 *    @fullname   string    required    Required for the user identity
	 * Return :
	 *    @response   object               
	 **/
	function userProfile(req, res) {

	 	var response = {
	 		type: 'userProfile',
	 		error: '403',
	 		data: "Access forbidden : user not logged."
	 	};
	 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

	 	response = {
	 		type: 'userProfile',
	 		error: '401',
	 		data: "Argument(s) missing !"
	 	};

	 	if(!req.body.userId) return res.end(JSON.stringify(response));

	 	userModel.getUserProfile(req.body.userId,function(err, callback){
	 		if(err){
	 			response = {
	 				type: 'userProfile',
	 				error: '500',
	 				data: err.message,
	 			};
	 			return res.end(JSON.stringify(response));  
	 		}
	 		response = {
	 			type: 'userProfile',
	 			error: '0',
	 			data: callback.profile,
	 		};
	 		return res.end(JSON.stringify(response));
	 	});
	}

	/** 
	 * update
	 * METHOD : POST
	 * Description :
	 *    Update the user profile (according the server-session) in the database
	 * Body :
	 *    @username   string    required    Required for the user identity
	 *    @password   string    required    Required for the user identity
	 *    @fullname   string    required    Required for the user identity
	 * Return :
	 *    @response   object               
	 **/
	function update(req, res) {
	 	var response = {
	 		type: 'update',
	 		error: '403',
	 		data: "Access forbidden : user not logged."
	 	};

	 	if(!req.isAuthenticated()){ console.log('Not logged!!!'); return res.end(JSON.stringify(response));}

	 	if(!req.body.f_name || !req.body.l_name || !req.body.email || !req.body.major 
	 		|| !req.body.year || !req.body.netid){
	 		response = {
	 			type: 'update',
	 			error: '401',
	 			data: "Argument(s) missing !"
	 		};
	 		return res.end(JSON.stringify(response));
	 	}

	 	var fileName = null;
	 	if(req.body.fileLocation != ""){
	 		fileName = req.body.nickname + '.' + req.body.fileLocation.split('.')[1];

	 		fs.readFile(req.body.fileLocation, function (err, data) {
	 			if(err){
	 				response = {
	 					type: 'update',
	 					error: '500',
	 					data: err.message
	 				};
	 				return res.end(JSON.stringify(response));
	 			}

	 			var newPath = __dirname + "/../../profiles/" + fileName;
	 			fs.writeFile(newPath, data, function (err) {
	 				if(err){
	 					response = {
	 						type: 'update',
	 						error: '500',
	 						data: err.message
	 					};
	 					return res.end(JSON.stringify(response));
	 				}
	 			});
	 		});
	 	}

	 	userInfos = new Object({
	 		userId: req.user._id,
	 		f_name: req.body.f_name,
	 		l_name: req.body.l_name,
	 		email: req.body.email,
	 		major: req.body.major,
	 		year: req.body.year,
	 		pf_pic: fileName,
	 		netid: req.body.netid
	 	});

	 	userModel.updateUser(userInfos, function(err, cb){
	 		if(err){
	 			response = {
	 				type: 'update',
	 				error: '500',
	 				data: err.message
	 			};
	 			return res.end(JSON.stringify(response));
	 		}

	 		response = {
	 			type: 'update',
	 			error: '0',
	 			data: cb,
	 			message: "Update successful!!!"
	 		};
	 		return res.end(JSON.stringify(response));
	 	})
	}

	/** 
	 * getUsers
	 * METHOD : GET
	 Description :
	 *    Returns all the datasets from the database
	 * Return :
	 *    @response   object               
	 **/
	function getUsers(req,res){

		var response = {
			type: 'getUsers',
			error: '403',
			data: "Access forbidden : user not logged."
		};

		if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

		userModel.getAllUsers(function(err, cb){
			if(err){
				response = {
					type: 'getUsers',
					error: '500',
					data: err.message
				};
				return res.end(JSON.stringify(response))  
			}

			response = {
				type: 'getUsers',
				error: '0',
				data: cb
			};

			return res.end(JSON.stringify(response))
		});
	}

	/** 
	 * toggleAdmin
	 * METHOD : POST
	 Description :
	 *    Toggles the value published
	 * Return :
	 *    @response   object               
	 **/
	function toggleAdmin(req,res) {

	 	var response = {
	 		type: 'toggleAdmin',
	 		error: '403',
	 		data: "Access forbidden : user not logged."
	 	};

	 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

	 	response = {
	 		type: 'toggleAdmin',
	 		error: '400',
	 		data: 'Insufficient privileges!!!'
	 	};

	 	if(!req.user.isAdmin){
	 		return res.end(JSON.stringify(response));
	 	}

	 	userModel.toggleAdminbyID(req.body.userID, function(err, cb) {
	 		if(err){
	 			response = {
	 				type: 'toggleAdmin',
	 				error: '500',
	 				data: err.message
	 			};
	 			return res.end(JSON.stringify(response))
	 		}
	 		response = {
	 			type: 'toggleAdmin',
	 			error: '0',
	 			data: cb
	 		};
	 		return res.end(JSON.stringify(response)) 
	 	});
	}

	/** 
	 * pic
	 * METHOD : GET
	 * Description :
	 *    send Image
	 * Return :
	 *    @response   object                User informations (fullname, ...) for the client-side
	 **/
	function pic(req, res, next) {

	 	var response = {
	 		type: 'pic',
	 		error: '403',
	 		data: "Access forbidden : user not logged."
	 	};

	 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

	 	var options = {
	 		root: __dirname + '/../../profiles/',
	 		dotfiles: 'deny',
	 		headers: {
	 			'x-timestamp': Date.now(),
	 			'x-sent': true
	 		}
	 	};

	 	var fileName = req.params.name;
	 	if(fileName == ""){
	 		fileName = "default.png"
	 	}
	 	res.sendFile(fileName, options, function (err) {
	 		if (err) {
	 			console.log(err);
	 			return res.status(err.status).end();
	 		}
	 		console.log('Sent:', fileName);
	 	});
	}

	/** 
	 * logout
	 * METHOD : GET
	 * Description :
	 *    Log out the user by destroying his session
	 * Return :
	 *    @response   object                User informations (fullname, ...) for the client-side
	 **/
	function logout(req,res) {
	 	req.logout();

	 	var response = {
	 		type: 'logout',
	 		error: '0',
	 		data: ''
	 	};

	 	return res.end(JSON.stringify(response))
	}

	// ======================= DEFINE PASSPORT STRATEGIES ======================= //

	passport.use('local', new LocalStrategy({
		usernameField: 'nickname',
		passwordField: 'pwd'
		},function(username, password, done) {
			userModel.getUser(username,function(err, callback){
				if(!callback) return done(null, false, { message: 'Incorrect username.' });
				if(!bcrypt.compareSync(password, callback["password"])) return done(null, false, { message: 'Incorrect password.' });
				return done(null, callback);
			})
		}
	));

	passport.serializeUser(function(user, done) {
		done(null, user);
	});


	passport.deserializeUser(function(user, done) {
		userModel.getUser(user, function(err){
			if(err){
				done(err, null);
			}
			console.log(user);
			done(null, user);
		})
	});
};