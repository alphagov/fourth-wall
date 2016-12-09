(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Info = Backbone.Model.extend({

    initialize: function () {
      this.on('change:sha', function () {
        this.fetch();
      }, this);
    },

    url: function () {
      return [
        this.get('baseUrl'),
        this.get('userName'),
        this.get('repo'),
        'pulls',
        this.get('pullId')
      ].join('/');
    },

    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.get('baseUrl'));
    },

    parse: function (response) {
      return response;
    }
  });

}());
