(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Repos = Backbone.Collection.extend({

    model: FourthWall.Repo,

    initialize: function () {
      this.on('reset add remove', function () {
        this.fetch();

        this.each(function (model) {
          model.off();
          model.on('change', function () {
            this.trigger('change');
          }, this);
        }, this);
      }, this);
    },

    schedule: function () {
      var listInterval = FourthWall.getQueryVariable('listinterval') || 900;
      var statusInterval = FourthWall.getQueryVariable('interval') || 60;
      this.updateList();
      setInterval(_.bind(function () {
        this.updateList();
      }, this), listInterval * 1000);
      setInterval(_.bind(function () {
        this.fetch();
      }, this), statusInterval * 1000);
    },

    updateList: function () {
      var that = this;
      var passed_token = FourthWall.getToken('api.github.com'); // from URL params
      var optionalParameters, repoListUrl;
      if (passed_token !== false && passed_token !== "") {
        optionalParameters = {'access_token': passed_token};
      } else {
        optionalParameters = {};
      }

      // Default to gist, but use file otherwise
      if(!FourthWall.fileUrl){
        repoListUrl = 'https://api.github.com/gists/' + FourthWall.gistId;
      } else {
        // e.g. https://api.github.com/repos/roc/deploy-lag-radiator/contents/repos/performance-platform.json?ref=gh-pages
        var fileUrlParts = FourthWall.fileUrl.split("?");
        var fileUrlParamsString = fileUrlParts[1];
        var queryParams;
        if(fileUrlParamsString) {
          queryParams = FourthWall.getQueryParameters(fileUrlParamsString);
        } else {
          queryParams = {};
        }
        optionalParameters = $.extend({}, optionalParameters, queryParams);
        repoListUrl = fileUrlParts[0];
      }

      optionalParameters = FourthWall.buildQueryString(optionalParameters);

      $.ajax({
        type: 'GET',
        dataType: 'jsonp',
        url: repoListUrl + optionalParameters,
        success: function (data) {
          console.log(data);
          if(FourthWall.fileUrl){
            FourthWall.parseGithubFileData(data.data, that);
          } else {
            FourthWall.parseGistData(data, that);
          }
        },
        error : function (err) {
          console.log('error', err);
        }
      });
    },

    fetch: function () {
      this.each(function (model) {
        model.fetch();
      }, this);
    }

  });
}());
