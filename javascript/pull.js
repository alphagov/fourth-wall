(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.Pull = Backbone.Model.extend({
    initialize: function () {
      this.set('repo', this.collection.repo);
      this.comment = new FourthWall.Comment();
      this.comment.url = this.get('comments_url');
      this.on('change:comments_url', function () {
        this.comment.url = this.get('comments_url');
        this.comment.fetch();
      }, this);
      this.comment.on('change', function () {
        this.trigger('change');
      }, this);
      this.status = new FourthWall.Status({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo'),
        sha: this.get('head').sha
      });
      this.issue = new FourthWall.Issue({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo'),
        pullId: this.get('number')
      });
      this.master_head = new FourthWall.MasterHead({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo')
      });
      this.on('change:head', function () {
        this.status.set('sha', this.get('head').sha);
      }, this);
      this.status.on('change', function () {
        this.trigger('change');
      }, this);
      this.info = new FourthWall.Info({
        baseUrl: this.collection.baseUrl,
        userName: this.collection.userName,
        repo: this.get('repo'),
        pullId: this.get('number')
      }),
      this.on('change:head', function () {
        this.info.set('sha', this.get('head').sha);
      }, this);
      this.info.on('change', function () {
        this.trigger('change');
      }, this);
      this.fetch();
    },

    fetch: function () {
      this.status.fetch();
      this.issue.fetch();
      this.comment.fetch();
      this.info.fetch();
      this.master_head.fetch();
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
