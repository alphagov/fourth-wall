(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.ReviewComment = Backbone.Model.extend({
    parse: function (response) {
      var numComments = response.length;
      var approved = false;
      var changesRequested = false;
      var commentsByUser = this.splitCommentsByUser(response);
      var statuses = this.getStatus(commentsByUser);
      approved = statuses[0];
      changesRequested = statuses[1]

      return {
        approved: approved,
        changesRequested: changesRequested,
        numComments: numComments
      }
    },

    fetch: function() {
      return FourthWall.overrideFetch.call(this, this.url);
    },

    splitCommentsByUser: function(response) {
      var commentsByUser = []
      var single_user_comments = []
      while (response[0]) {
        single_user_comments.push(response.shift())
        response.forEach(function(comment, index) {
          if (comment.user.id === single_user_comments[0].user.id) {
            single_user_comments.push(comment);
          }
        })
        for (var i = response.length -1; i >= 0; i-- ) {
          if (response[i].user.id === single_user_comments[0].user.id) {
            response.splice(i, 1)
          };
        }
        commentsByUser.push(single_user_comments);
        single_user_comments = [];
      };
      return commentsByUser
    },
    
    getStatus: function(commentsByUser) {
      var approved = false;
      var changesRequested = false;
      commentsByUser.forEach(function (comments) {
        for (var x = comments.length -1; x >= 0; x-- ) {
          if (comments[x].state === 'APPROVED') {
            approved = true;
            break;
          } else if (comments[x].state === 'CHANGES_REQUESTED') {
            changesRequested = true;
            break;
          };
        }
      });
      return [approved, changesRequested];
    }
  });
}());
