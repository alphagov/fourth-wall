(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Repo = Backbone.Model.extend({
    defaults: {
      'baseUrl': 'https://api.github.com/repos'
    },

    initialize: function () {
      this.master = new FourthWall.MasterStatus({
        baseUrl: this.get('baseUrl'),
        userName: this.get('userName'),
        repo: this.get('repo'),
        defaultBranch: this.get('defaultBranch') || 'master'
      });

      this.master.on('change:failed', function () {
        this.trigger('change');
      }, this);

      this.pulls = new FourthWall.Pulls([], {
        baseUrl: this.get('baseUrl'),
        userName: this.get('userName'),
        repo: this.get('repo'),
        important: this.get('important')
      });

      this.pulls.on('reset add remove', function () {
        this.trigger('change');
      }, this);
    },

    fetch: function () {
      this.pulls.fetch();
      this.master.fetch();
    }

  });
}());
