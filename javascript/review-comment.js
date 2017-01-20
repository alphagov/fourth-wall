(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.ReviewComment = Backbone.Model.extend({
    parse: function (response) {
      var approved = response.some(function(comment) {
        return comment.state === 'APPROVED'
      });
      var changesRequested = response.some(function(comment) {
        return comment.state === 'CHANGES_REQUESTED'
      });
      return {
        approved: approved,
        changesRequested: changesRequested,
        numComments: response.length
      }
    },
    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.url);
    }
  });
}());
