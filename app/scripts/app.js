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

  app.openQueryBuilder = function(){
    document.querySelector("#qBuilder").open();
  }

  app.searchInput = function(e){
    debugger;
    var searchString = '\"' + document.querySelector("#qBuilder")._selectedFields.join('\" \"') + '\"'; 
    document.querySelector('#searchBar').query = searchString;
    document.querySelector('#searchBar').fire('paper-search-search');
  }


  app._openFilter = function(event){
    document.querySelector("#filterDialog").open();
  };

  app._searchFilters = function(event){
    debugger;
    app.set('selectedFilter',document.querySelector('#filterDialog').selectedFilters);
    app.set('searchQuery',document.querySelector('#searchBar').query);
    var num = 0;
    for (var i in app.selectedFilter){
      for (var j in app.selectedFilter[i]){
        num++;
      }
    }
    this.$.searchBar.nrSelectedFilters = num;

    switch(app.route){
      case 'datasetHome' :
        var response = {
          type: 'getDataPlots',
          dataset: {
            dataID: app.dataID,
            filter: app.selectedFilter,
            query: app.searchQuery
          }
        };
        console.log(response);
        app.fire("home-page-req", response);
        break;
      case 'home' : 
        var response = {
          type: 'getAllPlots',
          data: {
            filter: app.selectedFilter,
            query: app.searchQuery
          }
        };
        console.log(response);
        app.fire("home-page-req", response);
        break;
      case 'myPlots' :
        var response = {
        type: "getMyPlots",
        dataset: {
          dataID: app.dataID,
          filter: app.selectedFilter,
          query: app.searchQuery
        }
      };
      console.log(response);
      app.fire("plot-page-req", response);
        break;
    }
  }

  app.getProblem = function(id){
    for(var i in app.allProbs){
        if(app.allProbs[i]._id == id){
          return app.allProbs[i];
        }
      }
      return null;
  }

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

    document.addEventListener("home-page-req",function(data){
      var data = data.detail;
      console.dir(data);

      if(data.type === "getAllPlots") {

        ironAjax.url = "/api/getAllPlots";
        ironAjax.method = "POST";
        ironAjax.body = data.data;
        ironAjax.generateRequest();

      }

      else if(data.type === "getDataPlots") {

        ironAjax.url = "/api/getDataPlots";
        ironAjax.method = "POST";
        ironAjax.body = data.dataset;
        ironAjax.generateRequest();

      }

      else if(data.type === "getDatasets") {
        ironAjax.url = "/api/getDatasets";
        ironAjax.method = "GET";
        ironAjax.generateRequest();
      }

      else if(data.type === "getFilters") {
        ironAjax.url = "/api/getFilters";
        ironAjax.method = "GET";
        ironAjax.generateRequest();
      }

      else if(data.type === "getQueryParams") {
        ironAjax.url = "/api/getQueryParams";
        ironAjax.method = "GET";
        ironAjax.generateRequest();
      }
    });

    document.addEventListener('auth-form-sent',function(data){
      // console.log('In event listener!')
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

    document.addEventListener("dataset-form-sent",function(data){
      var data = data.detail;
      console.dir(data);

      if(data.type === "addDataset") {
        ironAjax.url = "/api/addDataset";
        ironAjax.method = "POST";
        ironAjax.body = data.formInputs;
        ironAjax.generateRequest();
      }
      else if(data.type === "removeDataset") {
        ironAjax.url = "/api/removeDataset";
        ironAjax.method = "POST";
        ironAjax.body = data.detail;
        ironAjax.generateRequest();
      }
      else if(data.type === "getDatasetsFull") {

        ironAjax.url = "/api/getDatasetsFull";
        ironAjax.method = "GET";
        ironAjax.generateRequest();
      }
    });

    document.addEventListener("plot-form-sent",function(data){
      // console.log('In prof-page-req event listener!');
      var data = data.detail;
      console.dir(data);

      if(data.type === "addPlot") {
        ironAjax.url = "/api/addPlot";
        ironAjax.method = "POST";
        ironAjax.body = data.formInputs;
        ironAjax.generateRequest();
      } 

      else if(data.type === "updatePlot") {
        ironAjax.url = "/api/updatePlot";
        ironAjax.method = "POST";
        ironAjax.body = data.formInputs;
        ironAjax.generateRequest();
      } 

      
    });

    document.addEventListener("plot-page-req",function(data){
      debugger;
      var data = data.detail;
      console.dir(data);

      if(data.type === "getPlot") {
        ironAjax.url = "/api/getPlot";
        ironAjax.method = "POST";
        ironAjax.body = data.data;
        ironAjax.generateRequest();
      }

      if(data.type === "getMyPlots") {
        debugger;
        ironAjax.url = "/api/getMyPlots";
        ironAjax.method = "POST";
        ironAjax.body = data.dataset;
        ironAjax.generateRequest();
      }

      else if(data.type === "togglePublished") {
        ironAjax.url = "/api/togglePublished";
        ironAjax.method = "POST";
        ironAjax.body = data.data;
        ironAjax.generateRequest();
      }

      else if(data.type === "toggleLikes") {
        ironAjax.url = "/api/toggleLikes";
        ironAjax.method = "POST";
        ironAjax.body = data.data;
        ironAjax.generateRequest();
      }

      else if(data.type === "postComment") {
        ironAjax.url = "/api/postComment";
        ironAjax.method = "POST";
        ironAjax.body = data.data;
        ironAjax.generateRequest();
      }

      else if(data.type === "getColumns") {
        ironAjax.url = "/api/getColumns";
        ironAjax.method = "POST";
        ironAjax.body = data.dataset;
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
    }


    app.logged = false;
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
        // page('/logout');
        break;
      case "update":
        app.prof = response["data"];
        page('/profile');
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
      case "addDataset":
        console.dir(response["data"]);
        page('/');
        break;
      case "removeDataset":
        console.dir(response["data"]);
        page('/admin/manageDataset');
        break;
      case "getDatasets":
        console.dir(response["data"]);
        app.allProbs = response["data"];
        break;
      case "getDatasetsFull":
        console.dir(response["data"]);
        app.allDatasetsFull = response["data"];
        break;
      case "getUsers":
        console.dir(response["data"]);
        app.Users = response["data"];
        break;
      case "showDataset":
        console.dir(response["data"]);
        app.pageTitle += response["data"].heading;
        app.datasetData = response["data"];
        break;
      case "getFilters":
        console.dir(response["data"]);
        app.filters = response["data"];
        break;
      case "getQueryParams":
        console.dir(response["data"]);
        app.queryParams = response["data"];
        break;

      case "getAllPlots":
      case "getDataPlots":
      case "getMyPlots":
        console.dir(response["data"]);
        app.set('allPlots',response["data"]);

        //Loop to get the liked content by the user
        if(app.logged){
          for(var i = 0; i < app.allPlots.length; i++) {
            for(var j = 0;j < app.allPlots[i].plots.length; j++){
              for(var k = 0;k < app.allPlots[i].plots[j].likes.length; k++){
                if(app.allPlots[i].plots[j].likes[k] == app.logged._id){
                  app.allPlots[i].plots[j]["liked"] = true;
                }
              } 
              if(!app.allPlots[i].plots[j].liked){
                app.allPlots[i].plots[j]["liked"] = false;
              }
            }
          }
        }
        break;
      case "getColumns":
        console.dir(response["data"]);
        app.columnData = response["data"].columns;
        break;
      case "togglePublished":
        console.dir(response["data"]);
        break;
      case "toggleLikes":
        console.dir(response["data"]);
        break;
      case "postComment":
        console.dir(response["data"]);
        break;
      case "toggleAdmin":
        console.dir(response["data"]);
        break;
      case "getPlot":
        console.dir(response["data"]);
        debugger;
        app.selectedPlot = response["data"]
        break;
      case "addPlot":
        console.dir(response["data"]);
        break;
      case "updatePlot":
        console.dir(response["data"]);
        break;
        
    }
  }

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    // imports are loaded and elements have been registered
    // For loading the side panel
    var ironAjax = document.querySelector("#ironAjax");
    var app = document.querySelector('#app');

    var response = {
      type: 'getDatasets',
    };
    console.log(response);
    app.fire("home-page-req", response);

    var response = {
      type: "getFilters",
    };
    console.log(response);
    app.fire("home-page-req", response);

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