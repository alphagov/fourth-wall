(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

	function statusStripePartial () {
		return `<div class="status-stripe"></div>`
	}

  function repoPartial (userName, repo, pullNum, link) {
    return `
			<a class="repo-partial" href="${link}">
				<h2 class="govuk-heading-m">
					${userName} / ${repo} &num;${pullNum}
				</h2>
			</a>
    `
  }

  function authorPartial (userName, avatarUrl) {
    return `
			<p class="author-partial govuk-body">
				<a class="author"
						 href="https://github.com/${userName}">
					<img src="${avatarUrl}" />
					<span>${userName}</span>
				</a>
			</p>
    `
  }

	function mergeablePartial (mergeable) {
		if (mergeable !== true) {
			return `
				<p class="mergeable-partial govuk-body">
					Not able to be merged
				</p>
			`
		}
	}

	function openDatePartial (createdAt, elapsedTime) {
		return `
			<p class="open-date-partial govuk-body"
           data-created-at="${createdAt}">
				${elapsedTime}
			</p>
		`
	}

	function assignedToPartial (assignee) {
		if (!assignee) return ``

		return `
			<p class="assigned-to-partial govuk-body">
				Assigned to @${assignee}
      </p>
    `
	}

	function commentsPartial (numComments) {
    if (numComments === 0) {
			return `<p class="comments-partial govuk-body">No comments</p>`
    } else if (numComments === 1) {
			return `<p class="comments-partial govuk-body">1 comment</p>`
		} else {
			return `<p class="comments-partial govuk-body">${numComments} comment</p>`
		}
  }

	function titlePartial (prTitle) {
		return `
			<div class="govuk-inset-text">
				${prTitle}
			</div>
    `
	}


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

      if (this.model.reviewComment.get('changesRequested')) {
        this.$el.addClass("changes-requested");
      } else if (this.model.reviewComment.get('approved')) {
        this.$el.addClass("thumbsup");
      }

      if (FourthWall.isWip(this.model)) {
        switch (FourthWall.wipHandling) {
          case 'small':
            this.$el.addClass("wip");
            break;
          case 'hide':
            this.$el.hide();
            break;
        }
      }

      this.$el.html([
				statusStripePartial(),

				`<div class="content">`,

        repoPartial(
					this.model.get('base').user.login,
					this.model.get('repo'),
					this.model.get('number'),
					this.model.get('html_url')
				),

				`<div class="pr-info">`,

        authorPartial(
          this.model.get('user').login,
          this.model.get('user').avatar_url
        ),

				"<div>",
				openDatePartial(
					this.model.get('created_at'),
					this.secondsToTime(this.model.get('elapsed_time'))
				),
				assignedToPartial(
					this.model.get('assignee')
				),
				commentsPartial(
					(
						this.model.comment.get('numComments') || 0
					) + (
						this.model.reviewComment.get('numComments') || 0
					)
				),
				mergeablePartial(this.model.info.get('mergeable')),
				"</div>",

				"</div>",

				titlePartial(
					this.escape(this.model.get('title'))
				),

				"</div>",
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
			return `${days} ${hours}h ${minutes}m`
    }
  });

}());
