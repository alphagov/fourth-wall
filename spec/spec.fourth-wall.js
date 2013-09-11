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

  afterEach(function() {
    $.mockjaxClear();  
  });

  describe("Repo", function () {

    describe("initialize", function () {
      it("instantiates an internal Comment model", function () {
        var repo = new FourthWall.Repo();
        expect(repo.comment instanceof FourthWall.Comment).toBe(true);
      });

      it("triggers a change when the comment changes", function () {
        var repo = new FourthWall.Repo();
        var changed = false;
        repo.on('change', function () {
          changed = true;
        });
        repo.comment.set('foo', 'bar');
        expect(changed).toBe(true);
      });

      it("fetches new comment data when the comment URL changes", function () {
        spyOn(FourthWall.Comment.prototype, "fetch");
        var repo = new FourthWall.Repo();
        repo.set('comments_url', 'foo');
        expect(repo.comment.url).toEqual('foo');
        expect(repo.comment.fetch).toHaveBeenCalled();
      });

      it("fetches new comment data when repo data has been fetched", function () {
        spyOn(FourthWall.Repo.prototype, "fetch");
        spyOn(FourthWall.Master.prototype, "fetch");
        spyOn(FourthWall.Comment.prototype, "fetch");
        FourthWall.Repo.prototype.fetch.plan = function () {
          this.trigger('sync');
        };
        var repo = new FourthWall.Repo();
        repo.fetch()
        expect(repo.comment.fetch).toHaveBeenCalled();
      });

      it("instantiates an internal Master model", function () {
        var repo = new FourthWall.Repo();
        expect(repo.master instanceof FourthWall.Master).toBe(true);
      });

      it("fetches new master data when repo data has been fetched", function () {
        spyOn(FourthWall.Repo.prototype, "fetch");
        spyOn(FourthWall.Master.prototype, "fetch");
        spyOn(FourthWall.Comment.prototype, "fetch");
        FourthWall.Repo.prototype.fetch.plan = function () {
          this.trigger('sync');
        };
        var repo = new FourthWall.Repo();
        repo.fetch()
        expect(repo.master.fetch).toHaveBeenCalled();
      });

      it("instantiates an internal Status model", function () {
        var repo = new FourthWall.Repo();
        expect(repo.status instanceof FourthWall.Status).toBe(true);
      });

      it("fetches new status data when the head changes", function () {
        spyOn(FourthWall.Status.prototype, "fetch");
        var repo = new FourthWall.Repo();
        repo.set('head', 'foo');
        expect(repo.status.fetch).toHaveBeenCalled();
      });

      it("triggers a change when the status changes", function () {
        var repo = new FourthWall.Repo();
        var changed = false;
        repo.on('change', function () {
          changed = true;
        });
        repo.status.set('foo', 'bar');
        expect(changed).toBe(true);
      });

      it("triggers a change when the master status changes", function () {
        var repo = new FourthWall.Repo();
        var changed = false;
        repo.on('change', function () {
          changed = true;
        });
        repo.master.status.set('failed', 'true');
        expect(changed).toBe(true);
      });
    });

    describe("url", function () {
      it("constructs a URL from user name and repo name", function () {
        var repo = new FourthWall.Repo({
          userName: 'foo',
          repo: 'bar'
        });
        expect(repo.url()).toEqual('https://api.github.com/repos/foo/bar/pulls');
      });
    });

    describe("parse", function () {
      it("calculates seconds since pull request creation date", function () {
        spyOn(FourthWall.Repo.prototype, "elapsedSeconds").andReturn(60);
        var repo = new FourthWall.Repo();
        var result = repo.parse([{ created_at: "2013-09-02T10:00:00+01:00" }]);
        expect(repo.elapsedSeconds).toHaveBeenCalledWith("2013-09-02T10:00:00+01:00");
        expect(result.elapsed_time).toEqual(60);
      });
    });

    describe("elapsedSeconds", function () {
      it("calculates seconds in working time since creation date", function () {
        setupMoment("2013-09-09T10:01:00+01:00", window)
        var repo = new FourthWall.Repo();
        var result = repo.parse([{ created_at: "2013-09-02T10:00:00+01:00" }]);
        var fullDay = 8 * 60 * 60;
        var expected = 
          7.5 * 60 * 60 // day 1: from 10:00 to 17:30
          + fullDay * 4 // days 2 - 4: tuesday to friday, weekend ignored
          + 31 * 60 // today: from 9:30 to 10:01
        expect(result.elapsed_time).toEqual(expected);
      });
    });
  });
});
