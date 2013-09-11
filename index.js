$(document).ready(function() {
    var repos = new FourthWall.Repos();
    var repoListView = new FourthWall.RepoListView({
        el: $('#pulls'),
        collection: repos
    })
    repos.updateList();
    setInterval(_.bind(function () {
      repos.updateList();
    }, this), 900000);
    setInterval(_.bind(function () {
      repos.fetch();
    }, this), 60000);
});

