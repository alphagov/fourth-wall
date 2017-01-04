(function () {
  "use strict";
  window.FourthWall = window.FourthWall || {};

  FourthWall.ListView = Backbone.View.extend({
    initialize: function () {
      this.collection.on('sort reset add remove', this.render, this);
    },

    render: function () {
      this.$el.empty();
      this.lis = [];
      this.collection.each(function (model) {
        var View;
        if (model instanceof FourthWall.MasterStatus) {
          View = FourthWall.MasterView;
        } else if (model instanceof FourthWall.Pull) {
          View = FourthWall.PullView;
        }
        if (!View) {
          return;
        }

        var view = new View({
          model: model,
          list: this
        });
        var ignoreWIP = FourthWall.ignoreWIP();
        var isWIP = view.model.get('title').indexOf('[WIP]') >= 0;
        view.render();
        if (!isWIP || (isWIP && !ignoreWIP)) {
            view.$el.appendTo(this.$el);
            this.lis.push(view);
        }
      }, this);
      if (this.lis.length) {
        $('#all-quiet').hide();
      } else {
        $('#all-quiet').show();
      }
    }
  });
}());
