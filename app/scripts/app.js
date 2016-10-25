/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

(function(document) {
	'use strict';
	// Grab a reference to our auto-binding template
	// and give it some initial binding values
	// Learn more about auto-binding templates at http://goo.gl/Dx1u2g
	var app = document.querySelector('#app');

	app.displayInstalledToast = function() {
		document.querySelector('#caching-complete').show();
	};

	app.openOverlay = function(event){

			app.set('type',event.currentTarget.getAttribute('type'));
			backdrop.open();      
	};

	app._profileButtonAction = function(event){
			debugger;
			var type = event.currentTarget.getAttribute('type');
			if(type == "userProfile/"){
				type += app.logged._id;
			}
			page('/' + type);
	}

	// Listen for template bound event to know when bindings
	// have resolved and content has been stamped to the page
	app.addEventListener('dom-change', function() {
		console.log('Our app is ready to rock!');
		var ironAjax = document.querySelector("#ironAjax");

		document.addEventListener('auth-form-sent',function(data){
			var data = data.detail;
			console.dir(data);

			if(data.type === "login") {
				ironAjax.url = "/api/login";
				ironAjax.method = "POST"
				ironAjax.body = data.formInputs;
				ironAjax.generateRequest();
			} else if(data.type === "register") {

				ironAjax.url = "/api/register";
				ironAjax.method = "POST"
				ironAjax.body = data.formInputs;
				ironAjax.generateRequest();

			} else if(data.type === "update") {

				ironAjax.url = "/api/update";
				ironAjax.method = "POST";
				ironAjax.body = data.formInputs;
				ironAjax.generateRequest();

			}
		});

		document.addEventListener("prof-page-req",function(data){
			debugger;
			var data = data.detail;
			console.dir(data);

			if(data.type === "profile") {
				ironAjax.url = "/api/profile";
				ironAjax.method = "POST";
				ironAjax.body = data.user;
				ironAjax.generateRequest();
			} 

			else if(data.type === "userProfile"){
				ironAjax.url = "/api/userProfile";
				ironAjax.method = "POST";
				ironAjax.body = data.user;
				ironAjax.generateRequest();
			}
		});

		document.addEventListener("password-forgot-form-sent",function(data){
			var data = data.detail;
			console.dir(data);

			if(data.type === "forgot") {

				ironAjax.url = "/api/forgot";
				ironAjax.method = "POST";
				ironAjax.body = data.formInputs;
				ironAjax.generateRequest();

			}
		});

		document.addEventListener("user-page-req",function(data){
			var data = data.detail;
			console.dir(data);

			if(data.type === "getUsers") {

				ironAjax.url = "/api/getUsers";
				ironAjax.method = "GET";
				ironAjax.generateRequest();

			}

			if(data.type === "toggleAdmin") {

				ironAjax.url = "/api/toggleAdmin";
				ironAjax.method = "POST";
				ironAjax.body = data.data;
				ironAjax.generateRequest();
			}

		});

		app._logOutuser = function(){
			ironAjax.url = "/api/logout";
			ironAjax.method = "GET"
			ironAjax.generateRequest();
			app.logged = false;
		}


		
	});

	app._handleResponse = function(data){
		debugger;
		console.dir(data.detail.response);
		var response = data.detail.response;

		if(response["error"] != 0) {
			app.errorMsg = response["data"];
			this.$.errorMsg.open();
			if(response["error"] == 403){
				page('/logout');
			}
			return console.log(response["data"]);
		}

		else{
			if(response["message"]){
				app.infoMsg = response["message"];
				this.$.infoMsg.open();
			}
		}

		switch(response["type"]) {
			case "register":
				page('/');
				break;
			case "login":
				app.logged = response["data"];
				backdrop.close();
				page('/');
				break;
			case "logout":
				app.logged = false;
				break;
			case "update":
				app.prof = response["data"];
				debugger;
				page('/userProfile/' + app.logged._id);
				break;
			case "profile":
				app.prof = response["data"];
				break;
			case "userProfile":
				app.userProf = response["data"];
				break;
			case "forgot":
				console.dir(response["data"]);
				break;
			case "getUsers":
				console.dir(response["data"]);
				app.Users = response["data"];
				break;				
		}
	}

	// See https://github.com/Polymer/polymer/issues/1381
	window.addEventListener('WebComponentsReady', function() {
		// imports are loaded and elements have been registered
		// For loading the side panel
		var ironAjax = document.querySelector("#ironAjax");
		var app = document.querySelector('#app');

		if(app.logged){
			debugger;
			var response = {
				type: "profile",
				user: app.logged
			};
			console.log(response);
			app.fire("prof-page-req", response);
		}
	});

	// Close drawer after menu item is selected if drawerPanel is narrow
	app.onMenuSelect = function() {
		var drawerPanel = document.querySelector('#paperDrawerPanel');
		if (drawerPanel.narrow) {
			drawerPanel.closeDrawer();
		}
	};
})(document);