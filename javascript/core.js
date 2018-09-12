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
        var arrayKey = /^(.*)\[\]$/.exec(n[0]);
        if (arrayKey) {
          if (params[arrayKey[1]] instanceof Array) {
            params[arrayKey[1]].push(n[1]);
          } else {
            params[arrayKey[1]] = [n[1]];
          }
        } else {
          params[n[0]] = n[1];
        }
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
    var teams = [];
    Object.keys(params).filter(function(key) {
      var match = key.match(/team$/);
      return match && match[0] == 'team';
    }).forEach(function(key) {
      var hostname = key.match(/^(.*?)_?team$/)[1];
      if (hostname === "") {
        hostname = "api.github.com";
      }
      var teamStrings = params[key];
      if (! (teamStrings instanceof Array)) {
        teamStrings = [teamStrings];
      }
      teamStrings.forEach(function(teamStr) {
        var fullTeamName = stripSlash(teamStr).split('/');
        if (fullTeamName.length !== 2) {
          throw "Team name must contain a slash {org}/{team}";
        }
        teams.push({
          org: fullTeamName[0],
          team: fullTeamName[1],
          hostname: hostname,
          baseUrl: getBaseUrlFromHostname(hostname),
        });
      });
    });
    return teams;
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
      data: options.data
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
        xhr.setRequestHeader('Accept', 'application/vnd.github.black-cat-preview+json');
      }
    };
  };

  // hack for SimpleHTTPServer appending a slash
  var stripSlash = function(string){
    if (string) {
      return string.replace(/\/$/, '');
    }
  };

  FourthWall.isWip = function(pull) {
    for (const wipString of FourthWall.wipStrings) {
      if (pull.get('title').toLowerCase().includes(wipString.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  FourthWall.filterUsers = !!stripSlash(
    FourthWall.getQueryVariable('filterusers')
  );

  //to deal with fact that query var could be string or array,
  // put query var in array and then flatten it all out
  var repos = [FourthWall.getQueryVariable('filterrepo') || ''];
  FourthWall.filterRepos = [].concat.apply([], repos)
    .map(stripSlash);

  FourthWall.gistId = stripSlash(
    FourthWall.getQueryVariable('gist')
  );
  FourthWall.fileUrl = stripSlash(
    FourthWall.getQueryVariable('file')
  );
  FourthWall.importantUsers = [];

  FourthWall.wipHandling = (FourthWall.getQueryVariable('wiphandling') || 'small');

  FourthWall.wipStrings = ['WIP', 'DO NOT MERGE', 'REVIEW ONLY'];
})();
