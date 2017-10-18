(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Comment = Backbone.Model.extend({
    parse: function (response) {
      return {
        numComments: response.length
      };
    },
    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.url);
    }
  });
}());
