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

  FourthWall.fetchReposFromFileUrl = function () {
    // e.g. https://api.github.com/repos/roc/deploy-lag-radiator/contents/repos/performance-platform.json?ref=gh-pages
    return FourthWall.fetchDefer({
      url: FourthWall.fileUrl,
      done: function(result) {
        var repos = [];
        if (result.content) {
          repos = JSON.parse(
            atob(result.content)
          ).map(function (item) {
            // map to ensure gist style keys present
            // we extend the item to ensure any provided baseUrls are kept
            return $.extend(item, {
              'userName': item.owner || item.userName,
              'repo': item.name ||  item.repo
            });
          });
        }
        return repos;
      }
    });
  };

  FourthWall.fetchReposFromGist = function () {
    return FourthWall.fetchDefer({
      url: "https://api.github.com/gists/" + FourthWall.gistId,
      done: function(result) {
        var repos = [];
        Object.keys(result.files).forEach(function(file) {
          var fileData = result.files[file],
              language = fileData.language;
          if (file == "users.json") {
            if (fileData.content) {
              FourthWall.importantUsers = JSON.parse(fileData.content);
            }
          } else if ($.inArray(language, ['JavaScript', 'JSON', null])) {
            repos = JSON.parse(fileData.content);
          } else if (language === "CSS") {
            var $custom_css = $('<style>');
            $custom_css.text( filedata.content );
            $('head').append( $custom_css );
          }
        });
        return repos;
      }
    });
  };

  FourthWall.fetchReposFromTeams = function () {
    var promises = [];

    FourthWall.getTeams().forEach(function(team) {
      promises.push(FourthWall.fetchReposFromTeam(team));
    });

    var d = $.Deferred();
    $.when.apply(null, promises).done(function() {
      var repos = [].reduce.call(arguments, FourthWall.mergeRepoArrays, []);
      d.resolve(repos);
    });

    return d.promise();
  };

  FourthWall.mergeRepoArrays = function(repos1, repos2) {
    var result = _.clone(repos1);
    if (repos2) {
      repos2.forEach(function(repo) {
        var found = result.some(function(testRepo) {
          return _.isEqual(repo, testRepo);
        });
        if (!found) {
          result.push(repo);
        }
      });
    }
    return result;
  };

  FourthWall.fetchReposFromTeam = function(team) {
    var d = $.Deferred();
    FourthWall.fetchTeamId(team).done(function(teamId) {
      FourthWall.fetchDefer({
        url: team.baseUrl + "/teams/" + teamId + "/repos",
        done: function (result) {
          d.resolve(result.map(function(item) {
            return {
              repo: item.name,
              userName: item.owner.login,
              baseUrl: team.baseUrl + "/repos",
            };
          }));
        }
      });
    });
    return d;
  };

  FourthWall.fetchTeamId = function(team) {
    return FourthWall.fetchDefer({
      url: team.baseUrl + '/orgs/' + team.org + '/teams',
      done: function (result) {
        for (var i = 0; i < result.length; i++) {
          if (result[i].name === team.team) {
            return result[i].id;
          }
        }
      }
    });
  };

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

  FourthWall.gistId = stripSlash(
    FourthWall.getQueryVariable('gist')
  );
  FourthWall.fileUrl = stripSlash(
    FourthWall.getQueryVariable('file')
  );

})();
