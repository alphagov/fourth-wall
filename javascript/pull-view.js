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

      var thumbsup = '';
      if (this.model.comment.get('thumbsup')) {
        thumbsup = '&#128077;'; // 👍
      }

      var suffix = "";
      if (this.model.comment.get('numComments') !== 1) {
        suffix = "s";
      }

      var statusFailed = this.model.status.get('failed');
      var statusPending = this.model.status.get('state') === 'pending';
      var statusMergable = this.model.info.get('mergeable');
      var statusString = this.generateStatusHTML(this.model.info, this.model.status);

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

      var labelsHTML = "";
      if (FourthWall.showLabels &&
            this.model.issue.get('labels') &&
            this.model.issue.get('labels').length > 0) {
        var labels = this.model.issue.get('labels')
        for (var i = 0; i < labels.length; i++) {
            labelsHTML += '<div class="label" style="border-color: #' +
                            labels[i].color + ';">' + labels[i].name + ' </div>';
        }
      }


      var needsRebase = undefined;
      var baseSyncHTML = "";
      if (this.model.branchHead.get('object') &&
          this.model.get('base')) {

          needsRebase = this.model.branchHead.get('object').sha !== this.model.get('base').sha;
          if (needsRebase) {
            baseSyncHTML = '<div class="base-sync base-sync-rebase">Needs Rebase</div>';
          }
          else {
            baseSyncHTML = '<div class="base-sync base-sync-ok">Up-to-date</div>';
          }
      }

      if (needsRebase === false && statusFailed === false &&
          statusPending === false && statusMergable === true) {
        this.$el.addClass("ready");
      }

      this.$el.html([
        '<div class="card-header">',
          '<img class="avatar" src="', this.model.get('user').avatar_url, '" />',
          '<div class="card-label">',
          '<span class="username">',this.model.get('user').login,'</span>',
          '<div class="elapsed-time" data-created-at="', this.model.get('created_at'),'">',
            this.secondsToTime(this.model.get('elapsed_time')),
            '</div>',
          '</div>',
        '<div class="status-holder">', statusString , baseSyncHTML,'</div>',
        '</div>',
        '<p><a href="', this.model.get('html_url'), '">',
        ' (#',
        this.model.get('number'),
        ') ',
        this.escape(this.model.get('title')),
        '</a>' + assignee + '</p>',
        labelsHTML,
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
    },

    generateStatusHTML: function(info, status) {
      var classes = '';
      var text = '';
      var success = false;

      if (status.get('state')){
        var state = status.get('state');
        var statuses = status.get('statuses');
        var success_count = 0;

        success = state === 'success';

        for (var i = 0; i < statuses.length; i++) {
          if (statuses[i].state === 'success') {
            success_count++;
          }
        }
        classes = state;
        text = state + ' (' + success_count + '/' + statuses.length + ')';
      } else {
        text = 'Unknown';
      }

      // if status is success but PR is not mergable, overwrite status...
      if (success && info.get('mergeable') === false){
        classes = 'not-mergeable';
        text = 'Merge Conflicts';
      }

      return '<span class="status ' + classes + '">' + text + '</span>';
    }
  });

}());
