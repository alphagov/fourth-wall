(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.MasterView = FourthWall.PullView.extend({
    render: function () {
      this.$el.removeClass();

      this.$el.addClass('failed');
      this.$el.html([
        '<h2>', this.model.get('repo'), '</h2>',
        '<p>Failing on master</p>'
      ].join(''));
    }
  });
}());
