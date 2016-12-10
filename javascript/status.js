(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Status = Backbone.Model.extend({

    initialize: function () {
      this.on('change:ref', function () {
        this.fetch();
      }, this);
    },

    url: function () {
      return [
        this.get('baseUrl'),
        this.get('userName'),
        this.get('repo'),
        'commits',
        this.get('ref'),
        'status'
      ].join('/');
    },

    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.get('baseUrl'));
    },

    parse: function (response) {
      var data = response;
      data.failed = data.state !== 'success' && data.state !== 'pending';
      return data;
    }
  });
}());
