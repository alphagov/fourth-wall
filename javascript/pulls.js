(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Pulls = Backbone.Collection.extend({

    model: FourthWall.Pull,

    initialize: function (models, options) {
      this.baseUrl = options.baseUrl;
      this.userName = options.userName;
      this.repo = options.repo;
    },

    url: function () {
      return [
        this.baseUrl,
        this.userName,
        this.repo,
        'pulls'
      ].join('/');
    },

    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.baseUrl);
    }
  });
}());
