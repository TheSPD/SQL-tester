
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
