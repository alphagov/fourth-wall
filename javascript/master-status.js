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
        this.get('defaultBranch')
      ].join('/');
    }
  });
}());
