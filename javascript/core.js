(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};
  
  FourthWall.importantUsers = [];

  FourthWall.getQueryVariables = function(search) {
    search = search || FourthWall._getLocationSearch();
    return search
      .replace(/(^\?)/,'')
      .split("&")
      .reduce( function(params, n) {
        n = n.split("=");
        params[n[0]] = n[1];
        return params;
      }, {});
  };

  FourthWall.getQueryVariable = function (name, search) {
    return FourthWall.getQueryVariables(search)[name];
  };

  FourthWall._getLocationSearch = function() {
    return window.location.search;
  };

  FourthWall.buildQueryString = function(params) {
    var param_string = $.param(params);
    if(param_string.length > 0) {
      param_string = "?" + param_string;
    }
    return param_string;
  };

  FourthWall.getToken = function (hostname) {
    var token = FourthWall.getQueryVariable(hostname+'_token');
    if (token === undefined && hostname == 'api.github.com') {
      token = FourthWall.getQueryVariable('token');
    }
    return token;
  };

  FourthWall.getTokenFromUrl = function (url) {
    var a = document.createElement('a');
    a.href = url;
    return FourthWall.getToken(a.hostname);
  };

  FourthWall.hasTeams = function() {
    return FourthWall.getTeams().length > 0;
  };

  FourthWall.getTeams = function() {
    var params = FourthWall.getQueryVariables();
    return Object.keys(params).filter(function(key) {
      var match = key.match(/team$/);
      return match && match[0] == 'team';
    }).map(function(key) {
      var hostname = key.match(/^(.*?)_?team$/)[1];
      if (hostname === "") {
        hostname = "api.github.com";
      }
      var fullTeamName = stripSlash(params[key]).split('/');
      if (fullTeamName.length !== 2) {
        throw "Team name must contain a slash {org}/{team}";
      }
      return {
        org: fullTeamName[0],
        team: fullTeamName[1],
        hostname: hostname,
        baseUrl: getBaseUrlFromHostname(hostname),
      };
    });
  };

  function getBaseUrlFromHostname(hostname) {
    if (hostname === "api.github.com") {
      return "https://api.github.com";
    } else {
      return "https://" + hostname + "/api/v3";
    }
  }

  FourthWall.fetchDefer = function(options) {
    var d = $.Deferred();
    $.ajax({
      type: "GET",
      beforeSend: setupAuthentication(options.url),
      url: options.url,
    }).done(function(result) {
      d.resolve(options.done(result));
    }).fail(d.reject);

    return d.promise();
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
        xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
      }
    };
  };

  // hack for SimpleHTTPServer appending a slash
  var stripSlash = function(string){
    if (string) {
      return string.replace(/\/$/, '');
    }
  };

  FourthWall.showAllUsers = stripSlash(
    FourthWall.getQueryVariable('show_all_users')
  );

  FourthWall.gistId = stripSlash(
    FourthWall.getQueryVariable('gist')
  );
  FourthWall.fileUrl = stripSlash(
    FourthWall.getQueryVariable('file')
  );

})();
