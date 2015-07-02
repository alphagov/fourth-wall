(function() {
  "use strict"
  window.FourthWall = window.FourthWall || {};

  FourthWall.FetchRepos = {};

  var FetchRepos = FourthWall.FetchRepos;

  FourthWall.FetchRepos.fetchFromEverywhere = function () {
    var promises = [];

    if (FourthWall.fileUrl) {
      promises.push(fetchReposFromFileUrl());
    }
    if (FourthWall.gistId) {
      promises.push(fetchReposFromGist());
    }
    if (FourthWall.hasTeams()) {
      promises.push(fetchReposFromTeams());
    }

    var d = $.Deferred();
    $.when.apply(null, promises).done(function() {
      var allRepos = [].reduce.call(arguments, FetchRepos.mergeRepoArrays, []);
      d.resolve(allRepos);
    });
    return d;
  };

  // exposed so that it can be tested
  FourthWall.FetchRepos.mergeRepoArrays = function(repos1, repos2) {
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

  var fetchReposFromFileUrl = function () {
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

  var fetchReposFromGist = function () {
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
          } else if ($.inArray(language, ['JavaScript', 'JSON', null]) !== -1) {
            repos = JSON.parse(fileData.content);
          } else if (language === "CSS") {
            var $custom_css = $('<style>');
            $custom_css.text( fileData.content );
            $('head').append( $custom_css );
          }
        });
        return repos;
      }
    });
  };

  var fetchReposFromTeams = function () {
    var promises = [];

    FourthWall.getTeams().forEach(function(team) {
      promises.push(fetchReposFromTeam(team));
    });

    var d = $.Deferred();
    $.when.apply(null, promises).done(function() {
      var repos = [].reduce.call(arguments, FetchRepos.mergeRepoArrays, []);
      d.resolve(repos);
    });

    return d.promise();
  };

  var fetchReposFromTeam = function(team) {
    var d = $.Deferred();
    fetchTeamId(team).done(function(teamId) {
      FourthWall.fetchDefer({
        url: team.baseUrl + "/teams/" + teamId + "/repos",
        data: { per_page: 100 },
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

  var fetchTeamId = function(team) {
    return FourthWall.fetchDefer({
      // team.list results are paginated, try and get as many in the first page
      // as possible to map slug-to-id (github max is 100 per-page)
      url: team.baseUrl + '/orgs/' + team.org + '/teams',
      data: { per_page: 100 },
      done: function (result) {
        for (var i = 0; i < result.length; i++) {
          if (result[i].slug === team.team) {
            return result[i].id;
          }
        }
        throw "Couldn't map team '" + team.team + "' to an ID"
      }
    });
  };

}());
