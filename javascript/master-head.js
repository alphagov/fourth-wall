(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.MasterHead = FourthWall.Status.extend({
    url: function () {
      return [
        this.get('baseUrl'),
        this.get('userName'),
        this.get('repo'),
        'git',
        'refs',
        'heads',
        'master'
      ].join('/');
    },

    parse: function (response) {
      return response;
    }
  });
}());
