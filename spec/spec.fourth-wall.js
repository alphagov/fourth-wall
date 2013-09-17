function setupMoment(date, anObject) {
  spyOn(anObject, "moment");
  anObject.moment.plan = function () {
    var realMoment = anObject.moment.originalValue;
    // set "now" to a fixed date to enable static expectations
    if (!arguments.length) {
      return realMoment(date);
    }
    return realMoment.apply(null, arguments);
  }    
}

describe("Fourth Wall", function () {

  describe("Repos", function () {
    describe("schedule", function () {

      var repos;
      beforeEach(function() {
        spyOn(FourthWall, "getQueryVariable");
        spyOn(window, "setInterval");
        spyOn(FourthWall.Repos.prototype, "fetch");
        spyOn(FourthWall.Repos.prototype, "updateList");
        repos = new FourthWall.Repos();
      });

      it("updates the repo list every 15 minutes by default", function () {
        repos.schedule();
        expect(repos.updateList.callCount).toEqual(1);
        expect(setInterval.argsForCall[0][1]).toEqual(900000);
        var callback = setInterval.argsForCall[0][0];
        callback();
        expect(repos.updateList.callCount).toEqual(2);
      });

      it("updates the repo list at a configurable interval", function () {
        FourthWall.getQueryVariable.andReturn(120);
        repos.schedule();
        expect(setInterval.argsForCall[0][1]).toEqual(120000);
        var callback = setInterval.argsForCall[0][0];
        callback();
        expect(repos.updateList).toHaveBeenCalled();
      });

      it("updates the status every 60 seconds by default", function () {
        repos.schedule();
        expect(setInterval.argsForCall[1][1]).toEqual(60000);
        var callback = setInterval.argsForCall[1][0];
        callback();
        expect(repos.fetch).toHaveBeenCalled();
      });

      it("updates the status at a configurable interval", function () {
        FourthWall.getQueryVariable.andReturn(10);
        repos.schedule();
        expect(setInterval.argsForCall[1][1]).toEqual(10000);
        var callback = setInterval.argsForCall[1][0];
        callback();
        expect(repos.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Repo", function () {

    describe("initialize", function () {
      it("instantiates an internal Master model", function () {
        var repo = new FourthWall.Repo();
        expect(repo.master instanceof FourthWall.MasterStatus).toBe(true);
      });

      it("instantiates an internal list of pull requests", function () {
        var repo = new FourthWall.Repo();
        expect(repo.pulls instanceof FourthWall.Pulls).toBe(true);
      });

      it("triggers a change when the master status changes", function () {
        var repo = new FourthWall.Repo();
        var changed = false;
        repo.on('change', function () {
          changed = true;
        });
        repo.master.set('failed', 'true');
        expect(changed).toBe(true);
      });
    });

    describe("fetch", function () {
      it("fetches new master and pulls data", function () {
        spyOn(FourthWall.MasterStatus.prototype, "fetch");
        spyOn(FourthWall.Pulls.prototype, "fetch");
        var repo = new FourthWall.Repo();
        repo.fetch();
        expect(repo.master.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Pull", function () {
    describe("initialize", function () {

      var pull;
      beforeEach(function() {
        spyOn(FourthWall.Comment.prototype, "fetch");
        spyOn(FourthWall.Status.prototype, "fetch");
        pull = new FourthWall.Pull({
          head: {sha: 'foo'}
        }, {
          collection: {}
        });
      });

      it("instantiates an internal Comment model", function () {
        expect(pull.comment instanceof FourthWall.Comment).toBe(true);
      });

      it("triggers a change when the comment changes", function () {
        var changed = false;
        pull.on('change', function () {
          changed = true;
        });
        pull.comment.set('foo', 'bar');
        expect(changed).toBe(true);
      });

      it("fetches new comment data when the comment URL changes", function () {
        pull.set('comments_url', 'foo');
        expect(pull.comment.url).toEqual('foo');
        expect(pull.comment.fetch).toHaveBeenCalled();
      });

      it("fetches new comment data when pull data has been fetched", function () {
        pull.fetch()
        expect(pull.comment.fetch).toHaveBeenCalled();
      });

      it("instantiates an internal Status model", function () {
        expect(pull.status instanceof FourthWall.Status).toBe(true);
      });

      it("fetches new status data when the head changes", function () {
        pull.set('head', 'foo');
        expect(pull.status.fetch).toHaveBeenCalled();
      });

      it("triggers a change when the status changes", function () {
        var changed = false;
        pull.on('change', function () {
          changed = true;
        });
        pull.status.set('foo', 'bar');
        expect(changed).toBe(true);
      });
    });

    describe("parse", function () {
      it("calculates seconds since pull request creation date", function () {
        spyOn(FourthWall.Pull.prototype, "elapsedSeconds").andReturn(60);
        spyOn(FourthWall.Comment.prototype, "fetch");
        spyOn(FourthWall.Status.prototype, "fetch");
        var pull = new FourthWall.Pull({
          head: {sha: 'foo'}
        }, {
          collection: {}
        });
        var result = pull.parse({ created_at: "2013-09-02T10:00:00+01:00" });
        expect(pull.elapsedSeconds).toHaveBeenCalledWith("2013-09-02T10:00:00+01:00");
        expect(result.elapsed_time).toEqual(60);
      });
    });

    describe("elapsedSeconds", function () {
      it("calculates seconds in working time since creation date", function () {
        setupMoment("2013-09-09T10:01:00+01:00", window)
        spyOn(FourthWall.Comment.prototype, "fetch");
        spyOn(FourthWall.Status.prototype, "fetch");
        var pull = new FourthWall.Pull({
          head: {sha: 'foo'}
        }, {
          collection: {}
        });
        var result = pull.parse({ created_at: "2013-09-02T10:00:00+01:00" });
        var fullDay = 8 * 60 * 60;
        var expected = 
          7.5 * 60 * 60 // day 1: from 10:00 to 17:30
          + fullDay * 4 // days 2 - 4: tuesday to friday, weekend ignored
          + 31 * 60 // today: from 9:30 to 10:01
        expect(result.elapsed_time).toEqual(expected);
      });
    });
  });

  describe("Pulls", function () {
    describe("url", function () {
      it("constructs a URL from user name and repo name", function () {
        var pulls = new FourthWall.Pulls([], {
          userName: 'foo',
          repo: 'bar'
        });
        expect(pulls.url()).toEqual('https://api.github.com/repos/foo/bar/pulls');
      });
    });
  });

  describe("ListItems", function () {
    describe("fetch", function () {
      it("collects open pull requests from repos", function () {
        var repo = new FourthWall.Repo({
          userName: 'foo',
          repo: 'bar'
        });
        repo.pulls.reset();
        var items = new FourthWall.ListItems([], {
          repos: new FourthWall.Repos([
            
          ])
        });
      });
    });
  });
});
