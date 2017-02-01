(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.ListItems = Backbone.Collection.extend({

    initialize: function (models, options) {
      this.repos = options.repos;
      this.repos.on('change', function () {
        this.fetch();
      }, this);
    },

    isMaster: function (x) {
      return x instanceof FourthWall.MasterStatus;
    },

    isThumbsUp: function (x) {
      return ((x.comment.get('thumbsup') || x.reviewComment.get('approved')) && !x.reviewComment.get('changesRequested'));
    },

    compare: function (f, a, b) {
      if (f(a) && f(b)) {
        return 0;
      } else if (f(a)) {
        return -1;
      } else if (f(b)) {
        return 1;
      }
    },

    cmp: function(a, b) {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      if (a > b) return -1;
      if (b > a) return 1;
      return 0;
    },

    comparator: function (a, b) {

      var res = this.compare(this.isMaster, a, b);
      if (res != null) {
        return res;
      }

      res = this.compare(this.isThumbsUp, a, b);
      if (res != null) {
        return res;
      }

      var timeA = a.get('elapsed_time'),
      timeB = b.get('elapsed_time');

      if ( FourthWall.getQueryVariable('recent') ) {
        return this.cmp(timeB, timeA);
      }
      else {
        return this.cmp(timeA, timeB);
      }
    },

    fetch: function () {
      var models = [];
      this.repos.each(function (repo) {
        repo.pulls.each(function (pull) {
          models.push(pull);
        });
        if (repo.master.get('failed')) {
          models.push(repo.master);
        }
      }, this);
      this.reset(models);
    }
  });
}());
