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

    updateList: function() {
      FourthWall.FetchRepos.fetchFromEverywhere().done(this.reset.bind(this));
    },

    fetch: function () {
      this.each(function (model) {
        model.fetch();
      }, this);
    }

  });
}());
