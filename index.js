$(document).ready(function() {
    var repos = new FourthWall.Repos();
    var items = new FourthWall.ListItems([], {
        repos: repos
    });
    var repoListView = new FourthWall.ListView({
        el: $('#pulls'),
        collection: items
    })
    repos.schedule();
});

