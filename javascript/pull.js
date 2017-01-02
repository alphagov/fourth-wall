(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Pull = Backbone.Model.extend({
    initialize: function () {
      this.set('repo', this.collection.repo);

      this.comment = new FourthWall.Comment({
        baseUrl: this.collection.baseUrl,
        commentsUrl: this.get('comments_url')
      });

      this.status = new FourthWall.Status({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo'),
        ref: this.get('head').sha
      });

      this.issue = new FourthWall.Issue({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo'),
        pullId: this.get('number')
      });

      this.branchHead = new FourthWall.BranchHead({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo'),
        branch: this.get('base').ref
      });

      this.info = new FourthWall.Info({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo'),
        pullId: this.get('number')
      }),

      this.on('change:comments_url', function () {
        this.comment.commentsUrl = this.get('comments_url');
        this.comment.fetch();
      }, this);

      this.on('change:head', function () {
        this.status.set('ref', this.get('head').sha);
        this.info.set('sha', this.get('head').sha);
      }, this);

      this.on('change:base', function () {
        this.branchHead.set('branch', this.get('base').ref);
      }, this);

      this.comment.on('change', function () {
        this.trigger('change');
      }, this);

      this.status.on('change', function () {
        this.trigger('change');
      }, this);

      this.info.on('change', function () {
        this.trigger('change');
      }, this);

      this.branchHead.on('change', function () {
        this.trigger('change');
      }, this);

      this.fetch();
    },

    fetch: function () {
      this.status.fetch();
      this.issue.fetch();
      this.comment.fetch();
      this.info.fetch();
      this.branchHead.fetch();
    },

    parse: function (data) {
      data.elapsed_time = this.elapsedSeconds(data.created_at);
      return data;
    },

    elapsedSeconds: function (created_at) {
      var now = moment();
      created_at = moment(created_at);
      return now.unix() - created_at.unix();
    }
  });
}());
