(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};


  FourthWall.PullView = Backbone.View.extend({
    tagName: 'li',

    initialize: function () {
      this.model.on('change', this.render, this);
    },

    render: function () {
      this.$el.removeClass();

      if (!this.model.get('user')) {
        // FIXME: Should never get here but does after master was
        // failing
        return;
      }

      this.$el.addClass(this.ageClass(this.model.get('elapsed_time')));

      if (FourthWall.filterUsers && FourthWall.importantUsers.length > 0 && $.inArray(this.model.get('user').login, FourthWall.importantUsers) == -1) {
        this.$el.addClass('unimportant-user');
      }

      if (!this.model.collection.important) {
        this.$el.addClass('unimportant-repo');
      }

      if (this.model.comment.get('thumbsup')) {
        this.$el.addClass("thumbsup");
      }

      var suffix = "";
      if (this.model.comment.get('numComments') !== 1) {
        suffix = "s";
      }

      if (this.model.info.get('mergeable') === false){
        var statusString = '<p class="status not-mergeable">No auto merge</p>';
      } else if (this.model.status.get('state')){
        var state = this.model.status.get('state');
        var statusString = '<p class="status ' + state + '">Status: ' + state + '</p>';
      } else {
        var statusString = '<p class="status">No status</p>';
      }

      var commentCount = 0;
      if (this.model.comment.get('numComments')){
        commentCount = commentCount + this.model.comment.get('numComments');
      }
      if (this.model.info.get('review_comments')){
        commentCount = commentCount + this.model.info.get('review_comments');
      }

      var assignee = "";
      if (this.model.get('assignee')) {
        assignee = ' under review by ' + this.model.get('assignee').login;
        this.$el.addClass("under-review");
      }

      this.$el.html([
        '<img class="avatar" src="', this.model.get('user').avatar_url, '" />',
        statusString,
        '<h2>', this.model.get('repo'), '</h2>',
        '<div class="elapsed-time" data-created-at="',
        this.model.get('created_at'),
        '">',
        this.secondsToTime(this.model.get('elapsed_time')),
        '</div>',
        '<p><a href="', this.model.get('html_url'), '">',
        '<span class="username">',this.model.get('user').login,'</span>',
        ': ',
        this.escape(this.model.get('title')),
        ' (#',
        this.model.get('number'),
        ')',
        '</a>' + assignee + '</p>',
        '<p class="comments"> ' + commentCount + " comment" + suffix + '</p>',
      ].join(''));
    },

    escape: function (string) {
      return $('<div>').text(string).html();
    },

    ageClass: function (seconds) {
      var hours = 3600;
      if (seconds > (6 * hours)) {
        return "age-old";
      } else if (seconds > (2 * hours)) {
        return "age-aging";
      } else {
        return "age-fresh";
      }
    },

    secondsToTime: function (seconds) {
      var days    = Math.floor(seconds / 86400);
      var hours   = Math.floor((seconds - (days * 86400)) / 3600);
      var minutes = Math.floor((seconds - (days * 86400) - (hours * 3600)) / 60);

      if (hours   < 10) {hours   = "0"+hours;}
      if (minutes < 10) {minutes = "0"+minutes;}
      if (days == 1) {
        days = days + " day";
      } else if (days > 1) {
        days = days + " days";
      } else {
        days = "";
      }
      return days + ' ' + hours + 'h ' + minutes + 'm';
    }
  });

}());
