(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.BranchHead = FourthWall.Status.extend({

    initialize: function () {
      this.on('change:branch', function () {
        this.fetch();
      }, this);
    },

    url: function () {
      return [
        this.get('baseUrl'),
        this.get('userName'),
        this.get('repo'),
        'git',
        'refs',
        'heads',
        this.get('branch')
      ].join('/');
    },

    parse: function (response) {
      return response;
    },

    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.get('baseUrl'));
    }
  });
}());
