(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.ReviewComment = Backbone.Model.extend({
    parse: function (response) {
      var approved = response.some(function(comment) {
        return comment.state === 'APPROVED'
      });
      return {
        approved: approved,
        numComments: response.length
      }
    },
    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.url);
    }
  });
}());
