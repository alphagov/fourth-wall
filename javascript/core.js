(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};
  
  FourthWall.importantUsers = [];

  FourthWall.getQueryParameters = function(str) {
    return str
      .replace(/(^\?)/,'')
      .split("&")
      .reduce( function(params, n) {
        n = n.split("=");
        params[n[0]] = n[1];
        return params;
      }, {});
  };
  FourthWall.buildQueryString = function(obj) {
    var param_string = $.param(obj);
    if(param_string.length > 0) {
      param_string = "?" + param_string;
    }
    return param_string;
  };

  // http://css-tricks.com/snippets/javascript/get-url-variables/
  FourthWall.getQueryVariable = function (variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] === variable) {
        // nasty fix for passing in urls like
        // https://api.github.com/repos.json?ref=some-branch
        if(pair[2]){
          return pair[1] + '=' + pair[2];
        }
        return pair[1];
      }
    }
    return false;
  };

  FourthWall.getToken = function (hostname) {
    var token = FourthWall.getQueryVariable(hostname+'_token');
    if (token === false && hostname == 'api.github.com') {
      token = FourthWall.getQueryVariable('token');
    }
    return token;
  };

  FourthWall.getTokenFromUrl = function (url) {
    var a = document.createElement('a');
    a.href = url;
    return FourthWall.getToken(a.hostname);
  };

  FourthWall.parseGistData = function (gistData, that) {
    var config = [];
    for (var file in gistData.data.files) {
      if (gistData.data.files.hasOwnProperty(file)) {
        var filedata = gistData.data.files[file],
        lang = filedata.language;

        if (file == 'users.json') {
          var usersFile = filedata.content
          if (usersFile) {
            FourthWall.importantUsers = JSON.parse(usersFile);
          }
        } else if (lang == 'JavaScript' || lang == 'JSON' || lang == null) {
          var configFile = JSON.parse(filedata.content);
          if (configFile) {
            config.push(configFile);
          }
        } else if (lang == 'CSS') {
          var $custom_css = $('<style>');
          $custom_css.text( filedata.content );
          $('head').append( $custom_css );
        }
      }
    }

    if (config.length > 0) {
      that.reset.call(that, config[0]);
    }
  };

  FourthWall.parseGithubFileData = function (data, that) {

    // base64 decode the bloody thing
    if (!data.content) {
      return false;
    }

    var contents = JSON.parse(
      atob(data.content)
    ).map(function (item) {
      // map to ensure gist style keys present
      // we extend the item to ensure any provided baseUrls are kept
      return $.extend(item, {
        'userName': item.owner || item.userName,
        'repo': item.name ||  item.repo
      });
    });

    that.reset.call(that, contents);
  };

  FourthWall.overrideFetch = function(url) {
    return Backbone.Model.prototype.fetch.apply(this, [{
      beforeSend: setupAuthentication(url)
    }]);
  };

  var setupAuthentication = function (baseUrl) {
    return function(xhr) {
      var token = FourthWall.getTokenFromUrl(baseUrl);
      if (token !== false && token !== '') {
        xhr.setRequestHeader('Authorization', 'token ' + token);
      }
    };
  };

  // hack for SimpleHTTPServer appending a slash
  var stripSlash = function(string){
    if (string) {
      return string.replace(/\/$/, '');
    }
  };

  FourthWall.gistId = stripSlash(
    FourthWall.getQueryVariable('gist')
  );
  FourthWall.fileUrl = stripSlash(
    FourthWall.getQueryVariable('file')
  );

})();
