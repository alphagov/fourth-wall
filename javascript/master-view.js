(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.MasterView = FourthWall.PullView.extend({

    descriptionPartial: function(branch) {
      return `<p class="govuk-body">
        Failing on ${branch}
      </p>`
    },

    render: function () {
      this.$el.removeClass();

      this.$el.addClass('failed');
      this.$el.html([
        this.statusStripePartial(),
        `<div class="content">`,
        this.repoPartial(
          this.model.get('userName'),
          this.model.get('repo'),
          'master',
          this.model.get('html_url')
        ),
        this.descriptionPartial(
          this.model.get('defaultBranch')
        ),
        `</div>`,
      ].join(''));
    }
  });
}());
