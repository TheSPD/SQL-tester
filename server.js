
// Including and starting all inclusions
var serverPort = 5000;
var express = require("express");
var app = express()
, bcrypt = require('bcryptjs')
, session = require('express-session')
, FileStore = require('session-file-store')(session)
, bodyParser = require('body-parser')
, server = require('http').createServer(app)
, passport = require('passport')
, LocalStrategy = require('passport-local').Strategy
, multer = require('multer')
, fs = require('fs')
, util = require('util')
, nodemailer = require('nodemailer')
, crypto = require('crypto')
, mongoose = require('mongoose').connect('mongodb://localhost:27017/Data-SQL-Tester')
, parse = require('csv-parse');


app.use(express.static(__dirname + '/app'));
// app.set('view engine', 'html');
// app.set('views', './app/views');

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
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req,res,next){
		// Website you wish to allow to connect
		res.setHeader('Access-Control-Allow-Origin', '*');
		next();
	});

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

console.log("[I] Express server started on port " + serverPort + " ...");
console.log("[I] Socket.IO server started on port " + serverPort + "...");

server.listen(serverPort);

// ======================= MONGODB POOL FUNCTIONS ======================= //

/** DESCRIBE MODELS **/
var schema = mongoose.Schema;

var userSchema = new schema({
	userName: String,
	password: String, 
	fullName: String,
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: Boolean,
	profile: {
		f_name: String,
		l_name: String,
		email: String,
		major: String,
		year: String,
		pf_pic: String,
		netid: String
	},
	createdAt: Date,
	myPlots: [{type : schema.ObjectId, ref : 'Plot'}],
	myLikes: [{type : schema.ObjectId, ref : 'Plot'}],
});

// var datasetSchema = new schema({
// 	heading: String,
// 	description: String,
// 	dataSet: String,
// 	createdBy: {type : schema.ObjectId, ref : 'User'},
// 	columns: [{
// 		name: String,
// 		description: String
// 	}],
// 	otherCols: [{
// 		name: String
// 	}],
// 	createdAt: Date,
// 	deadline: Date,
// 	plots: [{type : schema.ObjectId, ref : 'Plot'}],
// });

// var plotSchema = new schema({
// 	plot:String,
// 	forDataset:{type : schema.ObjectId, ref : 'Dataset'},
// 	submittedBy: {type : schema.ObjectId, ref : 'User'},
// 	submittedAt: Date,
// 	published: Boolean,
// 	publishedBy: {type : schema.ObjectId, ref : 'User'},
// 	publishedAt: Date,
// 	caption: String,
// 	plotType: String,
// 	xAxis: String,
// 	yAxis: String,  
// 	likes: [{type : schema.ObjectId, ref : 'User'}],
// 	comments: [{
// 		postedBy: {type : schema.ObjectId, ref : 'User'},
// 		postedAt: Date,
// 		text: String,
// 	}]
// });

// plotSchema.index({ caption: 'text', plotType: 'text', xAxis: 'text', yAxis: 'text' });

// var Dataset = mongoose.model('Dataset', datasetSchema);
var User = mongoose.model('User', userSchema);
// var Plot = mongoose.model('Plot', plotSchema);

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
						myPlots : [],
						myLikes : []
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

// // =================== DATASET =================== //

// /** 
//  * insertDataset
//  * Description :
//  *    Insert a new dataset in the database
//  * Properties :
//  *    @heading   string    required    heading to insert in the db
//  *    @description   string    required    description to insert in the db
//  *    @dataSet   string    required    dataSet to insert in the db
//  *    @dataDesc   string    required    dataDesc to insert in the db
//  */
// function insertDataset(userID, datasetInfos, callback) {
// 	var newDataset = new Dataset({
// 		heading: datasetInfos["heading"], 
// 		description: datasetInfos["description"], 
// 		dataSet: datasetInfos["dataset"],
// 		columns: datasetInfos["columns"],
// 		plots: [],
// 		createdAt : Date.now(),
// 		createdBy : userID,
// 		deadline : datasetInfos["deadline"],
// 	});

// 	newDataset.save(function(err){
// 		if(err) {
// 			return callback(err);
// 		}

// 		return callback(null,true);
// 	});
// }

// /** 
//  * getAllDatasets
//  * Description :
//  *    Fetches all the datasets from the database
//  * Properties :
//  */
// function getAllDatasets(callback) {
// 	var select = new Object({
// 		"heading" : 1,
// 		"dataSet" : 1
// 	});

// 	Dataset.find({},function(err, docs) {
// 		if(err) {          
// 			return callback(new Error(JSON.stringify(err)));
// 		}
// 		return callback(null, docs);
// 	}).select(select);
// }

// /** 
//  * getAllDatasetsFull
//  * Description :
//  *    Fetches all the datasets from the database
//  * Properties :
//  */
// function getAllDatasetsFull(callback) {
// 	Dataset.find({},function(err, docs) {
// 		if(err) {          
// 			return callback(new Error(JSON.stringify(err)));
// 		}
// 		return callback(null, docs);
// 	});
// }

// /** 
//  * getColumns
//  * Description :
//  *    Fetches the dataset's columns from the database with matching ID
//  * Properties :
//  *    @dataID      id        required    id of the dataset
//  */
// function getColumns(dataID,callback) {

// 	var select = new Object({
// 		"columns" : 1
// 	});

// 	Dataset.findById(dataID,function(err, docs) {
// 		if (err){          
// 			return callback(err);
// 		}

// 		return callback(null, docs);
// 	}).select(select);
// }

// /** 
//  * getDataset
//  * Description :
//  *    Fetches the dataset from the database which matches the id
//  * Properties :
//  */
// function getDataset(datasetInfos,callback) {
// 	Dataset.findById(datasetInfos.dataId,function(err, docs) {
// 		if(err) {          
// 			return callback(new Error(JSON.stringify(err)));
// 		}
// 		return callback(null, docs);
// 	});
// }

// /** 
//  * deleteDataset
//  * Description :
//  *    Fetches the dataset from the database which matches the id
//  * Properties :
//  */
// function deleteDataset(datasetInfos, callback) {
// 	Dataset.findById(datasetInfos.dataId,function(err, docs) {
// 		if(err) {          
// 			return callback(new Error(JSON.stringify(err)));
// 		}
// 		Plot.remove({_id : { $in : docs.plots}},function(err){
// 			if(err) {          
// 				return callback(new Error(JSON.stringify(err)));
// 			}
// 			Dataset.findByIdAndRemove(docs._id,function(err) {
// 				if(err){
// 					return callback(new Error(JSON.stringify(err)));   
// 				}
// 				return callback(null, docs);  
// 			}); 
// 		})
// 	});
// }

// // =================== PLOT =================== //

// /** 
//  * insertPlot
//  * Description :
//  *    Insert a new plot in the database
//  * Properties :
//  *   @userId      string    required    user ID
//  *   @dataId      string    required    data ID
//  *   @plotInfos   Object    required    plot Object to be inserted into the db
//  */
// function insertPlot(userInfos, dataId, plotInfos, callback) {

// 	var newPlot = new Plot({
// 		plot: plotInfos.plot,
// 		forDataset: dataId,
// 		submittedBy: userInfos.userId,
// 		submittedAt: Date.now(),
// 		published : false,
// 		caption : plotInfos.caption,
// 		plotType: plotInfos.type,
// 		xAxis: plotInfos.xAxis,
// 		yAxis: plotInfos.yAxis,
// 		likes: [],
// 		comments: [],
// 	});

// 	Dataset.findById(dataId,function(err,dataset){
// 		if(err){
// 			return callback(err);
// 		}

// 		console.log(dataset.deadline);
// 		console.log(Date.now());
// 		if(!userInfos.isAdmin && dataset.deadline < Date.now()){
// 			return callback(new Error("Over Deadline"));
// 		}

// 		newPlot.save(function(err){
// 			if(err){
// 				return callback(err);
// 			}

// 			User.findByIdAndUpdate(userInfos.userId,{ "$push" : {
// 				"myPlots" : newPlot._id
// 			}},{
// 				safe: true, 
// 				upsert: true
// 			},function(err){
// 				if(err){
// 					return callback(err)
// 				}
// 				Dataset.findByIdAndUpdate(dataId,{ "$push" : {
// 					"plots" : newPlot._id
// 				}},function(err){
// 					if(err){
// 						return callback(err);
// 					}
// 					if(plotInfos.isXOther){
// 						Dataset.findById(dataId,'otherCols',function(err,data){
// 							var found = false;
// 							for( var col in data.otherCols){
// 								if(newPlot.xAxis === data.otherCols[col].name){
// 									found = true;
// 								}
// 							}
// 							if(!found){
// 								Dataset.findByIdAndUpdate(dataId,{ "$push" : {
// 									"otherCols" : {
// 										"name" : newPlot.xAxis
// 									}
// 								}},function(err){
// 									if(err){
// 										return callback(err);
// 									}
// 								});
// 							}
// 						});	
// 					}

// 					if(plotInfos.isYOther){
// 						Dataset.findById(dataId,'otherCols',function(err,data){
// 							var found = false;
// 							for( var col in data.otherCols){
// 								if(newPlot.yAxis === data.otherCols[col].name){
// 									found = true;
// 								}
// 							}
// 							if(!found){
// 								Dataset.findByIdAndUpdate(dataId,{ "$push" : {
// 									"otherCols" : {
// 										"name" : newPlot.yAxis
// 									}
// 								}},function(err){
// 									if(err){
// 										return callback(err);
// 									}
// 								});
// 							}
// 						});
// 					}

// 					return callback(null,true);       
// 				});
// 			});
// 		});
// 	});	
// }

// /** 
//  * updatePlot
//  * Description :
//  *    Insert a new plot in the database
//  * Properties :
//  *   @userId      string    required    user ID
//  *   @dataId      string    required    data ID
//  *   @plotInfos   Object    required    plot Object to be inserted into the db
//  */
// function updatePlot(userId, dataId, plotInfos, callback) {

// 	var newPlot = new Object({
// 		forDataset: dataId,
// 		caption : plotInfos.caption,
// 		plotType: plotInfos.type,
// 		xAxis: plotInfos.xAxis,
// 		yAxis: plotInfos.yAxis,
// 	});

// 	if(plotInfos.plot){
// 		newPlot.plot = plotInfos.plot;
// 	}

// 	Plot.findByIdAndUpdate(plotInfos.plotId, newPlot, function(err){
// 		if(err){
// 			return callback(err);
// 		}
		
// 		if(plotInfos.isXOther){
// 					Dataset.findById(dataId,'otherCols',function(err,data){
// 						var found = false;
// 						for( var col in data.otherCols){
// 							if(newPlot.xAxis === data.otherCols[col].name){
// 								found = true;
// 							}
// 						}
// 						if(!found){
// 							Dataset.findByIdAndUpdate(dataId,{ "$push" : {
// 								"otherCols" : {
// 									"name" : newPlot.xAxis
// 								}
// 							}},function(err){
// 								if(err){
// 									return callback(err);
// 								}
// 							});
// 						}
// 					});	
// 				}

// 				if(plotInfos.isYOther){
// 					Dataset.findById(dataId,'otherCols',function(err,data){
// 						var found = false;
// 						for( var col in data.otherCols){
// 							if(newPlot.yAxis === data.otherCols[col].name){
// 								found = true;
// 							}
// 						}
// 						if(!found){
// 							Dataset.findByIdAndUpdate(dataId,{ "$push" : {
// 								"otherCols" : {
// 									"name" : newPlot.yAxis
// 								}
// 							}},function(err){
// 								if(err){
// 									return callback(err);
// 								}
// 							});
// 						}
// 					});
// 				}

// 		return callback(null,true);
// 	});
// }

// /** 
//  * getPlots
//  * Description :
//  *    Fetches all the plots from the database
//  * Properties :
//  */
// function getPlots(userInfos, dataInfos, plotInfos, callback) {
// 	var published = [true];

// 	if(userInfos.isAdmin || userInfos.userId){
// 		published.push(false);
// 	}

// 	var pipeline = [];

// 	if(plotInfos.query){
// 		pipeline.push({ '$match' : { '$text' : { '$search' : plotInfos.query } } });
// 	}

// 	pipeline.push({ "$match": { "published" : { $in : published}}});

// 	for( key in plotInfos.filter){
// 		if(plotInfos.filter[key].length>0){
// 			var match = {};
// 			match[key] = {$in : plotInfos.filter[key]};
// 			pipeline.push({"$match" : match});
// 		}
// 	}

// 	if(userInfos.userId){
// 		pipeline.push({ "$match" : { "submittedBy" : { $eq: new mongoose.Types.ObjectId(userInfos.userId) }}});
// 	}

// 	//For My Plots
// 	if(dataInfos.dataId){
// 		pipeline.push({ "$match" : { "forDataset" : { $eq: new mongoose.Types.ObjectId(dataInfos.dataId) }}});
// 	}

// 	pipeline.push({ '$group' : { 
// 		'_id' : { 
// 			'dataset' : '$forDataset'
// 		}, 
// 		'plots' : { 
// 			'$push' : {
// 				_id : "$_id", 
// 				plot : "$plot", 
// 				plotType : "$plotType",
// 				caption : "$caption",
// 				xAxis : "$xAxis",
// 				yAxis : "$yAxis",
// 				published : "$published",
// 				likes : "$likes",
// 				comments : "$comments"
// 			} 
// 		}
// 	}});

// 	Plot.aggregate(pipeline,function(err, docs) {
// 		if (err){          
// 			return callback(err);
// 		}
// 		Dataset.populate(docs, { path : '_id.dataset', select : 'heading' }, function(err, docs) {
// 			if (err){          
// 				return callback(err);
// 			}
// 			User.populate(docs, { path : 'plots.comments.postedBy', select : 'fullName'}, function(err,docs) {
// 				if (err){          
// 					return callback(err);
// 				}
// 				return callback(null, docs); 
// 			})
// 		});
// 	});
// }

// /** 
//  * getPlot
//  * Description :
//  *    Fetches the plot from the database
//  * Properties :
//  */
// function getPlot(userInfos, plotInfos, callback) {
// 	// var published = [true];

// 	// if(userInfos.isAdmin){
// 	// 	published.push(false);
// 	// }

// 	Plot.findById(plotInfos.plotId, function(err,docs){
// 		if (err){          
// 			return callback(err);
// 		}
// 		if(!docs){
// 			return callback(new Error("No plot found!!!"));
// 		}
// 		// if(published.indexOf(docs.published) < 0){
// 		// 	return callback(new Error("Plot not published!!!"));
// 		// }
// 		User.populate(docs, { 
// 			path : 'submittedBy publishedBy comments.postedBy likes', 
// 			select : 'userName fullName profile.pf_pic'}, function(err,docs) {
// 			if (err){          
// 				return callback(err);
// 			}
// 			return callback(null, docs); 
// 		});
// 	});
// }

// /** 
//  * togglePublished
//  * Description :
//  *    toggles the value of published
//  * Properties :
//  */
// function togglePublished(userInfos, plotInfos, callback) {
// 	var value = true;

// 	Plot.findById(plotInfos.plotId, function(err, docs){
// 		if (err){          
// 			return callback(new Error(err));
// 		}
		
// 		docs.published = !docs.published;

// 		if(docs.published){
// 			docs.publishedBy = userInfos.userId;
// 			docs.publishedAt = Date.now();
// 		}
// 		else{
// 			docs.publishedBy = null;
// 			docs.publishedAt = null;
// 		}

// 		docs.save(function(err, docs){
// 			if (err){          
// 				return callback(new Error(err));
// 			}
// 			return callback(null, value);
// 		});
// 	});
// }

// /** 
//  * toggleLikesbyID
//  * Description :
//  *    toggles the likes
//  * Properties :
//  */
// function toggleLikes(userInfos, plotInfos, callback) {
// 	Plot.findById(plotInfos.plotId,function(err, plot) {
// 		if(err){
// 			return callback(err);
// 		}
		
// 		var liked = (plot.likes.indexOf(userInfos.userId) >= 0);

// 		var plotUpdateVal = { "$push" : {
// 			"likes" : userInfos.userId
// 		}};

// 		var userUpdateVal = { "$push" : {
// 			"myLikes" : plot._id
// 		}};

// 		var updateOptions = {
// 			safe : true,
// 			upsert : true
// 		};

// 		if(liked){
// 			plotUpdateVal = { "$pull" : {
// 				"likes" : userInfos.userId
// 			}};

// 			userUpdateVal = { "$pull" : {
// 				"myLikes" : plot._id
// 			}};
// 		}

// 		plot.update(plotUpdateVal,function(err, retObj){
// 			if(err){
// 				return callback(err);
// 			}
// 			if(retObj.nModified == 0){
// 				return callback(new Error("Record Not found!!!"));
// 			}
// 			User.findByIdAndUpdate(userInfos.userId,userUpdateVal,updateOptions,function(err){
// 				if(err){
// 					return callback(err);
// 				}
// 				return (!liked)
// 			});
// 		});
// 	});
// }

// /** 
//  * postComment
//  * Description :
//  *    posts a comment
//  * Properties :
//  */
// function postComment(userInfos, plotInfos, commentInfos,callback) {

// 	var comment = {
// 		"postedBy" : userInfos.userId,
// 		"postedAt" : Date.now(),
// 		"text" : commentInfos.text,
// 	};

// 	var updateValue = {
// 		"$push" : {
// 			"comments" : comment
// 		}
// 	};

// 	var updateOptions = {
// 		safe : true,
// 		upsert : true
// 	};

// 	Plot.findByIdAndUpdate(plotInfos.plotId, updateValue, updateOptions, function(err){
// 		if(err){
// 			return callback(err)
// 		}
// 		return callback(null, comment)
// 	});
// }

// /** 
//  * getFilters
//  * Description :
//  *    Fetches all the filters from the database
//  * Properties :
//  */
// function getFilters(callback) {
// 	var filter = [{id:"plotType"
// 		,name: "Plot Type"
// 		,values:[ {id:"Scatter",name:"Scatter",selected:false}
// 		,{id:"Bar",name:"Bar",selected:false}
// 		,{id:"Mosaic",name:"Mosaic",selected:false}
// 		,{id:"Stacked Bar",name:"Stacked Bar",selected:false}
// 		,{id:"Grouped Bar",name:"Grouped Bar",selected:false}
// 		,{id:"Line",name:"Line",selected:false}
// 		,{id:"Other",name:"Other",selected:false}
// 	]}];

// 	return (callback(null, filter));
// }

// /** 
//  * getQueryParams
//  * Description :
//  *    Fetches all the filters from the database
//  * Properties :
//  */
// function getQueryParams(callback) {
// 	var plotTypes = {id:"plotType"
// 		,name: "Plot Type"
// 		,values:[ {id:"Scatter",name:"Scatter",selected:false}
// 		,{id:"Bar",name:"Bar",selected:false}
// 		,{id:"Mosaic",name:"Mosaic",selected:false}
// 		,{id:"Stacked Bar",name:"Stacked Bar",selected:false}
// 		,{id:"Grouped Bar",name:"Grouped Bar",selected:false}
// 		,{id:"Line",name:"Line",selected:false}
// 		,{id:"Other",name:"Other",selected:false}
// 	]};

// 	var pipeline = [];
// 	pipeline.push({ $group : {
// 		_id : "$_id", 
// 		name : {"$first" : "$heading"},
// 		values : {"$first" : "$columns"},
// 		otherVals: {"$first" : "$otherCols"}
// 	}});

// 	Dataset.aggregate(pipeline,function(err,data){
// 		if(err){
// 			return callback(err);
// 		}

// 		return (callback(null, plotTypes, data));
// 	});
// }

// ======================= DEFINE PASSPORT STRATEGIES ======================= //

// TODO : handle error if incorrect username
passport.use('local', new LocalStrategy({
	usernameField: 'nickname',
	passwordField: 'pwd'
},function(username, password, done) {
	getUser(username,function(err, callback){
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
	done(null, user);
});

// // ======================= START SOCKET.IO API ======================= //

// io.sockets.on('connection', function(client){
// 	console.log("[I] Receiving connection...");
// });

// ======================= START EXPRESS.JS API ======================= //


// ======================= ROUTES ======================= //
// app.get("/",function(req,res){
// 	res.render(__dirname + "/app/index.html", {titleo: 'lol'})
// });

// app.get("/loaderio-88cef5caf70cd9c10e08fc61ccf055c2.txt",function(req,res){
// 	res.sendFile(__dirname + '/loaderio-88cef5caf70cd9c10e08fc61ccf055c2.txt');
// });

// =================== USER =================== //

/** 
 * /reset/:user/:key
 * METHOD : GET
 * Description :
 *    Shows the reset password screen
 * Body :
 *    @user   string    required    Required for the user identity
 *    @key   string    required    Required for the user identity
 * Return :
 *    @response   HTML page               
 **/
app.get('/reset/:user/:key',function(req,res){

	getUser(req.params.user,function(err, callback){
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
});

/** 
 * /api/changePassword
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
app.post('/api/changePassword', function(req, res) {

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

	getUser(userInfos.userName,function(err, callback){
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

		if(callback == null
			|| !bcrypt.compareSync(userInfos.resetPasswordToken, callback["resetPasswordToken"]) 
			|| Date.now() > callback["resetPasswordExpires"]){ 
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
});

/** 
 * /api/register
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
app.post('/api/register', function(req, res) {

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
			
			var newPath = __dirname + "/profiles/" + fileName;
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

	insertUser(userInfos, function(err, cb){
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
});

/** 
 * /api/login
 * METHOD : POST
 * Description :
 *    Verify user credentials and create a server-based session
 * Body :
 *    @username   string    required    Required for the user identity
 *    @password   string    required    Required for the user identity
 * Return :
 *    @response   object                User informations (fullname, ...) for the client-side
 **/
app.post('/api/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {

		if (err) { 
			response = {
				type: 'login',
				error: '500',
				data: err.message
			};
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
});

/** 
 * /api/forgot
 * METHOD : POST
 * Description :
 *    Send Mail to the user with registered e-mail to reset the password
 * Body :
 *    @email   string    required    Required for the user identity
 * Return :
 *    @response   object               
 **/
app.post('/api/forgot', function(req, res) {
	var response = {
		type: 'forgot',
		error: '401',
		data: "Argument(s) missing !"
	};

	if(!req.body.email) return res.end(JSON.stringify(response));

	userInfos = new Object({
		email: req.body.email
	});

	getUserFromEmail(userInfos.email, function(err, cb){
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

		setPasswordReset(uInfo,function(err, cb){
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
});

/** 
 * /api/uploadImage
 * METHOD : POST
 * Description :
 *    Temporarily upload the display pictures
 * Return :
 *    @response   object                User informations (fullname, ...) for the client-side
 **/
app.post('/api/uploadImage', function(req,res) {

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
});

// // =================== DATASET =================== //

// /** 
//  * /api/getDatasets
//  * METHOD : GET
//  Description :
//  *    Returns all the datasets from the database
//  * Return :
//  *    @response   object               
//  **/
// app.get('/api/getDatasets', function(req,res) {

// 	getAllDatasets(function(err, cb){

// 		if(err){
// 			response = {
// 				type: 'getDatasets',
// 				error: '500',
// 				data: cb.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}

// 		response = {
// 			type: 'getDatasets',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/getDatasets
//  * METHOD : GET
//  Description :
//  *    Returns all the datasets from the database
//  * Return :
//  *    @response   object               
//  **/
// app.get('/api/getDatasetsFull', function(req,res) {

// 	getAllDatasetsFull(function(err, cb){

// 		if(err){
// 			response = {
// 				type: 'getDatasetsFull',
// 				error: '500',
// 				data: cb.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}

// 		response = {
// 			type: 'getDatasetsFull',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// // =================== PLOTS =================== //

// /** 
//  * /api/getAllPlots
//  * METHOD : POST
//  Description :
//  *    Get all the plots
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/getAllPlots', function(req,res) {


// 	var response;

// 	var userInfos = {
// 		isAdmin : false
// 	};
	
// 	if(req.user){
// 		userInfos.isAdmin = req.user.isAdmin;
// 	}

// 	console.log(req.body);
// 	var plotInfos = {
// 		filter: req.body.filter,
// 		query: req.body.query
// 	};

// 	var dataInfos = {}

// 	getPlots(userInfos, dataInfos, plotInfos, function(err, cb){

// 		if(err){
// 			response = {
// 				type: 'getAllPlots',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}      

// 		response = {
// 			type: 'getAllPlots',
// 			error: '0',
// 			data: cb
// 		};      
			
// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/getDataPlots
//  * METHOD : POST
//  Description :
//  *    Get plots for a dataset
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/getDataPlots', function(req,res) {

// 	var isAdmin = false;
// 	if(req.user){
// 		isAdmin = req.user.isAdmin;
// 	}

// 	var plotInfos = {    
// 		query : req.body.query,
// 		filter: req.body.filter
// 	};

// 	var userInfos= {
// 		isAdmin : isAdmin
// 	};

// 	var dataInfos = {
// 		dataId : req.body.dataID
// 	};

// 	getPlots(userInfos, dataInfos, plotInfos,function(err, cb) {
// 		if(err){
// 			response = {
// 				type: 'getDataPlots',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}      

// 		response = {
// 			type: 'getDataPlots',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/plot/:name
//  * METHOD : GET
//  * Description :
//  *    send Plot Image
//  * Return :
//  *    @response   object                User informations (fullname, ...) for the client-side
//  **/
// app.get('/api/plot/:name', function (req, res, next) {

// 	var response = {
// 		type: 'plotImage',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	var options = {
// 		root: __dirname + '/plots/',
// 		dotfiles: 'deny',
// 		headers: {
// 			'x-timestamp': Date.now(),
// 			'x-sent': true
// 		}
// 	};

// 	var fileName = req.params.name;
// 	res.sendFile(fileName, options, function (err) {
// 		if (err) {
// 			console.log(err);
// 			res.status(err.status).end();
// 		}
// 		else {
// 			console.log('Sent:', fileName);
// 		}
// 	});
// });


// /** 
//  * /api/getFilters
//  * METHOD : GET
//  Description :
//  *    Returns all the filters from the database
//  * Return :
//  *    @response   object               
//  **/
// app.get('/api/getFilters', function(req,res) {

// 	getFilters(function(err, cb){

// 		if(err){
// 			response = {
// 				type: 'getFilters',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}

// 		response = {
// 			type: 'getFilters',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/getQueryParams
//  * METHOD : GET
//  Description :
//  *    Returns all the filters from the database
//  * Return :
//  *    @response   object               
//  **/
// app.get('/api/getQueryParams', function(req,res) {

// 	getQueryParams(function(err, plotTypes, dataCols){

// 		if(err){
// 			response = {
// 				type: 'getQueryParams',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}

// 		response = {
// 			type: 'getQueryParams',
// 			error: '0',
// 			data: {
// 				plotTypes : plotTypes,
// 				datasetColumns : dataCols
// 			}
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });


// ======================= LOGGED IN ROUTES ======================= //

// =================== USER =================== //

/** 
 * /api/profile
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
app.post('/api/profile', function(req, res) {

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

	getUserProfile(req.user._id,function(err, callback){
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
});

/** 
 * /api/userProfile
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
app.post('/api/userProfile', function(req, res) {

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

	getUserProfile(req.body.userId,function(err, callback){
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
});

/** 
 * /api/update
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
app.post('/api/update', function(req, res) {
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

			var newPath = __dirname + "/profiles/" + fileName;
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

	updateUser(userInfos, function(err, cb){
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
});

/** 
 * /api/getUsers
 * METHOD : GET
 Description :
 *    Returns all the datasets from the database
 * Return :
 *    @response   object               
 **/
app.get('/api/getUsers', function(req,res) {

	var response = {
		type: 'getUsers',
		error: '403',
		data: "Access forbidden : user not logged."
	};

	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

	getAllUsers(function(err, cb){
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
});

/** 
 * /api/toggleAdmin
 * METHOD : POST
 Description :
 *    Toggles the value published
 * Return :
 *    @response   object               
 **/
app.post('/api/toggleAdmin', function(req,res) {

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
	
	toggleAdminbyID(req.body.userID, function(err, cb) {
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
});

/** 
 * /api/pic/:name
 * METHOD : GET
 * Description :
 *    send Image
 * Return :
 *    @response   object                User informations (fullname, ...) for the client-side
 **/
app.get('/api/pic/:name', function (req, res, next) {

	var response = {
		type: 'pic',
		error: '403',
		data: "Access forbidden : user not logged."
	};

	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

	var options = {
		root: __dirname + '/profiles/',
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
});

// // =================== DATASET =================== //

// /** 
//  * /api/data/:name
//  * METHOD : GET
//  * Description :
//  *    send Data files
//  * Return :
//  *    @response   object                User informations (fullname, ...) for the client-side
//  **/
// app.get('/api/data/:name', function (req, res, next) {

// 	var response = {
// 		type: 'dataFile',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	var fileName = req.params.name;
// 	res.download(__dirname+'/datasets/'+fileName, fileName.split('-')[2],function(err){
// 		if (err) {
// 			console.log(err);
// 			res.status(err.status).end();
// 		}
// 		else {
// 			console.log('Sent:', fileName);
// 		}
// 	});
// });

// /** 
//  * /api/uploadData
//  * METHOD : POST
//  * Description :
//  *    Temporarily upload the data
//  * Return :
//  *    @response   object                User informations (fullname, ...) for the client-side
//  **/
// app.post('/api/uploadData', function(req,res) {

// 	var response = {
// 		type: 'uploadDataset',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	uploadTemp(req,res,function(err) {
// 		var response = {
// 			type: 'uploadDataset',
// 			error: '500',
// 			data: 'Error Uploading File!'
// 		};
// 		if(err) {
// 			res.status(500).end(JSON.stringify(response));
// 		}

// 		var name = req.file.originalname.split('.');
// 		if(name[name.length - 1].toLowerCase() !== 'csv'){
// 			response = {
// 				type: 'uploadDataset',
// 				error: '400',
// 				data: 'Invalid File format'
// 			};
// 			res.status(400).end(JSON.stringify(response));
// 		}

// 		response = {
// 			type: 'uploadDataset',
// 			error: '0',
// 			data: req.file,

// 		};
// 		res.end(JSON.stringify(response));
// 	});
// });

// /** 
//  * /api/addDataset
//  * METHOD : POST
//  Description :
//  *    Register a dataset in the database
//  * Body :
//  *    @heading   string    required    Required for the Dataset
//  *    @description   string    required    Required for the Dataset
//  *    @dataSet   string    required    Required for the dataSet
//  *    @datadesc   string    required    Required for the Dataset
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/addDataset', function(req,res) {

// 	var response = {
// 		type: 'addDataset',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated() || !req.user.isAdmin){
// 		return res.end(JSON.stringify(response));
// 	}

// 	response = {
// 		type: 'addDataset',
// 		error: '400',
// 		data: 'Insufficient arguments!!!'
// 	};

// 	if(!req.body.datasetHead || !req.body.datasetDesc || 
// 	 !req.body.fileLocationDataset || !req.body.deadline){
// 		return res.end(JSON.stringify(response));      
// 	} 

// 	var datasetInfos = new Object({
// 		heading: req.body.datasetHead,
// 		description: req.body.datasetDesc,
// 		deadline: req.body.deadline,
// 	});

// 	var datasetToken = crypto.randomBytes(10).toString('hex');

// 	var fileNameDataset = datasetToken + '-' + Date.now() 
// 									+ '-dataSet' + '.' + req.body.fileLocationDataset.split('.')[1];
// 	datasetInfos.dataset = fileNameDataset;

// 	fs.readFile(req.body.fileLocationDataset, function (err, data) {
// 		if(err){
// 			response = {
// 				type: 'addDataset',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}

// 		var newPath = __dirname + "/datasets/" + fileNameDataset;
// 		fs.writeFile(newPath, data, function (err) {  
// 			if(err){
// 				response = {
// 					type: 'addDataset',
// 					error: '500',
// 					data: err.message
// 				};
// 				return res.end(JSON.stringify(response));
// 			}

// 			var parser = parse({delimiter: ','}, function(err, data){
// 				if(err){
// 					response = {
// 						type: 'addDataset',
// 						error: '500',
// 						data: err.message
// 					};
// 					return res.end(JSON.stringify(response));
// 				}

// 				datasetInfos.columns = [];

// 				for(var i=0;i<data[0].length;i++){
// 					datasetInfos.columns[i] = {
// 						name : data[0][i],
// 					}
// 				}

// 				insertDataset(req.user._id,datasetInfos,function(err, cb){
// 					if(err){
// 						var response = {
// 							type: 'addDataset',
// 							error: '500',
// 							data: err.message
// 						};
// 						return res.end(JSON.stringify(response))
// 					}

// 					response = {
// 						type: 'addDataset',
// 						error: '0',
// 						data: cb,
// 						message: "Data-set added successful!!!"
// 					};

// 					return res.end(JSON.stringify(response))
// 				});
// 			});

// 			fs.createReadStream(__dirname + '/datasets/' + fileNameDataset).pipe(parser);
// 		});
// 	});
// });

// /** 
//  * /api/removeDataset
//  * METHOD : POST
//  Description :
//  *    Delete a dataset in the database
//  * Body :
//  *    @id  string    required    Required for the Dataset
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/removeDataset', function(req,res) {

// 	var response = {
// 		type: 'removeDataset',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated() || !req.user.isAdmin){
// 		return res.end(JSON.stringify(response));
// 	}

// 	response = {
// 		type: 'removeDataset',
// 		error: '400',
// 		data: 'Insufficient arguments!!!'
// 	};

// 	if(!req.body.dataId){
// 		return res.end(JSON.stringify(response));      
// 	} 

// 	var datasetInfos = new Object({
// 		dataId: req.body.dataId
// 	});

// 	getDataset(datasetInfos, function(err,data){
// 		if(err){
// 			response = {
// 				type: 'removeDataset',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));        
// 		}

// 		var datasetPath = __dirname + "/datasets/" + data.dataSet;
// 		fs.unlink(datasetPath, function(err){
// 			if(err){
// 				response = {
// 					type: 'removeDataset',
// 					error: '500',
// 					data: err.message
// 				};
// 				return res.end(JSON.stringify(response));        
// 			}

// 			deleteDataset(datasetInfos, function(err, data){
// 				if(err){
// 					response = {
// 						type: 'removeDataset',
// 						error: '500',
// 						data: err.message
// 					};
// 					return res.end(JSON.stringify(response));        
// 				}
// 				response = {
// 					type: 'removeDataset',
// 					error: '0',
// 					data: data,
// 					info: 'Dataset deleted!!!'
// 				};
// 				return res.end(JSON.stringify(response));
// 			});
// 		});
// 	});
// });

// /** 
//  * /api/getColumns
//  * METHOD : POST
//  Description :
//  *    Get columns 
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/getColumns', function(req,res) {

// 	var response = {
// 		type: 'getColumns',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	getColumns(req.body.dataID,function(err, cb){

// 		if(err){
// 			response = {
// 				type: 'getColumns',
// 				error: '500',
// 				data: cb.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}

// 		cb.columns[cb.columns.length] = {
// 			"name" : "Other",
// 			"description" : "Other"
// 		}
			
// 		response = {
// 			type: 'getColumns',
// 			error: '0',
// 			data: cb
// 		};
		
// 		return res.end(JSON.stringify(response))
// 	});
// });

// // =================== PLOT =================== //

// /** 
//  * /api/addPlot
//  * METHOD : POST
//  Description :
//  *    Register a plot in the database
//  * Body :
//  *    
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/addPlot', function(req,res) {

// 	var response = {
// 		type: 'addPlot',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'addPlot',
// 		error: '400',
// 		data: 'Insufficient arguments!!!'
// 	};

// 	if(!req.body.caption || !req.body.dataId || !req.body.plotType || 
// 		!req.body.xAxis || !req.body.yAxis || !req.body.fileLocation || !req.body.userId){
// 		return res.end(JSON.stringify(response));
// 	}

// 	var plotInfos = new Object({
// 		caption: req.body.caption,    
// 		type: req.body.plotType,
// 		xAxis: req.body.xAxis,
// 		isXOther: req.body.isXOther,
// 		yAxis: req.body.yAxis,
// 		isYOther: req.body.isYOther,
// 	});

// 	var userInfos =new Object({
// 		userId : req.body.userId,
// 		isAdmin : req.user.isAdmin,
// 	});

// 	var userId = req.body.userId;

// 	var plotToken = crypto.randomBytes(10).toString('hex');
// 	var fileName = plotToken + '-'+ Date.now() + '.' + req.body.fileLocation.split('.')[1];
// 	plotInfos.plot = fileName;

// 	fs.readFile(req.body.fileLocation, function (err, data) {
// 		if(err){
// 			response = {
// 				type: 'addPlot',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}

// 		var newPath = __dirname + "/plots/" + fileName;
// 		fs.writeFile(newPath, data, function (err) {
// 			if(err){
// 				response = {
// 					type: 'addPlot',
// 					error: '500',
// 					data: err.message
// 				};
// 				return res.end(JSON.stringify(response));
// 			}

// 			insertPlot(userInfos, req.body.dataId, plotInfos,function(err,cb) {
// 				if(err){
// 					 response = {
// 						type: 'addPlot',
// 						error: '500',
// 						data: err.message
// 					};
// 					return res.end(JSON.stringify(response));
// 				}
				
// 				response = {
// 					type: 'addPlot',
// 					error: '0',
// 					data: cb,
// 					message: "Plot added successful!!!"
// 				};
// 				return res.end(JSON.stringify(response))
// 			});
// 		});
// 	});  
// });

// /** 
//  * /api/addPlot
//  * METHOD : POST
//  Description :
//  *    Register a plot in the database
//  * Body :
//  *    
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/updatePlot', function(req,res) {

// 	var response = {
// 		type: 'updatePlot',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated() || !req.user.isAdmin) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'updatePlot',
// 		error: '400',
// 		data: 'Insufficient arguments!!!'
// 	};

// 	if(!req.body.plotId || !req.body.caption || !req.body.dataId || !req.body.plotType || 
// 		!req.body.xAxis || !req.body.yAxis){
// 		console.log(req.body);
// 		return res.end(JSON.stringify(response));
// 	}

// 	var plotInfos = new Object({
// 		caption: req.body.caption,    
// 		type: req.body.plotType,
// 		xAxis: req.body.xAxis,
// 		isXOther: req.body.isXOther,
// 		yAxis: req.body.yAxis,
// 		isYOther: req.body.isYOther,
// 		plotId: req.body.plotId,
// 	});

// 	var userId = req.body.userId;

// 	if(req.body.fileLocation){
// 		var plotToken = crypto.randomBytes(10).toString('hex');
// 		var fileName = plotToken + '-'+ Date.now() + '.' + req.body.fileLocation.split('.')[1];
// 		plotInfos.plot = fileName;

// 		fs.readFile(req.body.fileLocation, function (err, data) {
// 			if(err){
// 				response = {
// 					type: 'updatePlot',
// 					error: '500',
// 					data: err.message
// 				};
// 				return res.end(JSON.stringify(response));
// 			}

// 			var newPath = __dirname + "/plots/" + fileName;
// 			fs.writeFile(newPath, data, function (err) {
// 				if(err){
// 					response = {
// 						type: 'updatePlot',
// 						error: '500',
// 						data: err.message
// 					};
// 					return res.end(JSON.stringify(response));
// 				}
// 			});
// 		});
// 	}

// 	updatePlot(userId, req.body.dataId, plotInfos,function(err,cb) {
// 		if(err){
// 			 response = {
// 				type: 'updatePlot',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}
		
// 		response = {
// 			type: 'updatePlot',
// 			error: '0',
// 			data: cb,
// 			message: "Plot update successful!!!"
// 		};
// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/getMyPlots
//  * METHOD : POST
//  Description :
//  *    Register a dataset in the database
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/getMyPlots', function(req,res) {

// 	var response = {
// 		type: 'getMyPlots',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	var isAdmin = false;
// 	if(req.user){
// 		isAdmin = req.user.isAdmin;
// 	}

// 	var plotInfos = {    
// 		query : req.body.query,
// 		filter: req.body.filter
// 	};

// 	var userInfos= {
// 		isAdmin : isAdmin,
// 		userId : req.user._id
// 	};

// 	var dataInfos = {};

// 	if(req.body.dataID !== 'all'){
// 		dataInfos.dataId = req.body.dataID;
// 	}

// 	getPlots(userInfos, dataInfos, plotInfos,function(err, cb) {
// 		if(err){
// 			response = {
// 				type: 'getMyPlots',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response))  
// 		}      

// 		response = {
// 			type: 'getMyPlots',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/getMyPlots
//  * METHOD : POST
//  Description :
//  *    Get a plot from database
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/getPlot', function(req,res) {

// 	var response = {
// 		type: 'getPlot',
// 		error: '400',
// 		data: "Insufficient Arguments!!!"
// 	};

// 	if(!req.body.plotId){
// 		return res.end(JSON.stringify(response));
// 	}

// 	var isAdmin = false;
// 	if(req.user){
// 		isAdmin = req.user.isAdmin;
// 	}

// 	var plotInfos = {    
// 		plotId : req.body.plotId
// 	};

// 	var userInfos= {
// 		isAdmin : isAdmin,
// 	};

// 	getPlot(userInfos, plotInfos,function(err, cb) {
// 		if(err){
// 			response = {
// 				type: 'getPlot',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}      

// 		response = {
// 			type: 'getPlot',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/togglePublished
//  * METHOD : POST
//  Description :
//  *    Toggles the value published
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/togglePublished', function(req,res){

// 	var response = {
// 		type: 'togglePublished',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'togglePublished',
// 		error: '403',
// 		data: 'Insufficient privileges!!!'
// 	};

// 	if(!req.user.isAdmin){
// 		return res.end(JSON.stringify(response));
// 	}  

// 	response = {
// 		type: 'togglePublished',
// 		error: '400',
// 		data: 'Insufficient arguments!!!'
// 	};

// 	if(!req.body.plotID){
// 		return res.end(JSON.stringify(response));
// 	}

// 	var userInfos = {
// 		userId : req.user._id
// 	}

// 	var plotInfos = {
// 		plotId : req.body.plotID
// 	}

// 	togglePublished(userInfos,plotInfos,function(err, cb){
// 		if(err){
// 			response = {
// 				type: 'togglePublished',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}

// 		response = {
// 			type: 'togglePublished',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/toggleLikes
//  * METHOD : POST
//  Description :
//  *    Toggles the value likes
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/toggleLikes', function(req,res){

// 	var response = {
// 		type: 'toggleLikes',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'toggleLikes',
// 		error: '400',
// 		data: 'Insufficient arguments!!!'
// 	};

// 	if(!req.body.plotID){
// 		return res.end(JSON.stringify(response));
// 	}

// 	var userInfos = {
// 		userId : req.user._id
// 	}

// 	var plotInfos = {
// 		plotId : req.body.plotID
// 	}

// 	toggleLikes(userInfos,plotInfos,function(err, cb){
// 		if(err){
// 			response = {
// 				type: 'toggleLikes',
// 				error: '500',
// 				data: err.message
// 			};
// 			return res.end(JSON.stringify(response));
// 		}

// 		response = {
// 			type: 'toggleLikes',
// 			error: '0',
// 			data: cb
// 		};

// 		return res.end(JSON.stringify(response))
// 	});
// });

// /** 
//  * /api/postComment
//  * METHOD : POST
//  Description :
//  *    Toggles the value likes
//  * Return :
//  *    @response   object               
//  **/
// app.post('/api/postComment', function(req,res){

// 	var response = {
// 		type: 'postComment',
// 		error: '403',
// 		data: "Access forbidden : user not logged."
// 	};

// 	if(!req.isAuthenticated()) return res.end(JSON.stringify(response));

// 	response = {
// 		type: 'postComment',
// 		error: '400',
// 		data: 'Insufficient arguments!!!'
// 	};

// 	if(!req.body.plotID || !req.body.text){
// 		return res.end(JSON.stringify(response));
// 	}

// 	var commentInfos = {
// 		text: req.body.text
// 	}

// 	var userInfos = {
// 		userId: req.user._id
// 	}

// 	var plotInfos = {
// 		plotId : req.body.plotID
// 	}

// 	postComment(userInfos, plotInfos, commentInfos,function(err, cb){
// 		if(err){
// 			response = {
// 				type: 'postComment',
// 				error: '500',
// 				data: err.message
// 			};
			
// 			return res.end(JSON.stringify(response))  
// 		}
		
// 		response = {
// 			type: 'postComment',
// 			error: '0',
// 			data: cb
// 		};
		
// 		return res.end(JSON.stringify(response))
// 	});
// });

/** 
 * /api/checkLogin
 * METHOD : GET
 Description :
 *    Check the login
 * Return :
 *    @response   object               
 **/
app.get('/api/checkLogin', function(req,res){

	var response = {
		type: 'postComment',
		error: '403',
		data: "Access forbidden : user not logged."
	};

	if(req.isAuthenticated()){
		response = {
			type: 'postComment',
			error: '0',
			data: 'Logged In : ' + req.user.userName,
		};
	}

	return res.end(JSON.stringify(response)) 
});

/** 
 * /api/logout
 * METHOD : GET
 * Description :
 *    Log out the user by destroying his session
 * Return :
 *    @response   object                User informations (fullname, ...) for the client-side
 **/
app.get('/api/logout', function(req,res) {
	req.logout();

	var response = {
		type: 'logout',
		error: '0',
		data: ''
	};

	return res.end(JSON.stringify(response))
});