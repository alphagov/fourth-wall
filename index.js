$(document).ready(function() {
    var repos = new FourthWall.Repos();
    var items = new FourthWall.ListItems([], {
        repos: repos
    });
    var repoListView = new FourthWall.ListView({
        el: $('#pulls'),
        collection: items
    })
    repos.updateList();
    setInterval(_.bind(function () {
      repos.updateList();
    }, this), 900000);
    setInterval(_.bind(function () {
      repos.fetch();
    }, this), 60000);
});

