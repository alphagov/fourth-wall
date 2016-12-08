(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.MasterStatus = FourthWall.Status.extend({
    url: function () {
      return [
        this.get('baseUrl'),
        this.get('userName'),
        this.get('repo'),
        'statuses',
        'master'
      ].join('/');
    },

    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.get('baseUrl'));
    }
  });
}());
