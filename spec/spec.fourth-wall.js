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

  describe("getQueryVariables", function () {
    it("should convert a query string into a params object", function () {
      var query_params = FourthWall.getQueryVariables("?ref=gh-pages&token=nonsense");
      expect(query_params).toEqual({'ref': 'gh-pages', 'token': 'nonsense'});
    });
    it("should return current location params object if no query string is provided", function() {
      spyOn(FourthWall, '_getLocationSearch').andReturn('?foo=bar&me=you');
      var query_params = FourthWall.getQueryVariables();
      expect(query_params).toEqual({foo: 'bar', me: 'you'});
    });
  });
  describe("getQueryVariable", function () {
    it("should get a query parameter from the provided query string", function () {
      spyOn(FourthWall, '_getLocationSearch').andReturn('?foo=bar');
      var value = FourthWall.getQueryVariable('foo', '?foo=everything');
      expect(value).toEqual('everything');
    });
    it("should get a query parameter from the current location", function () {
      spyOn(FourthWall, '_getLocationSearch').andReturn('?foo=bar');
      var value = FourthWall.getQueryVariable('foo');
      expect(value).toEqual('bar');
    });
  });
  describe("buildQueryString", function () {
    it("should convert a query string into a params object", function () {
      var query_string = FourthWall.buildQueryString({'ref': 'gh-pages', 'token': 'nonsense'});
      expect(query_string).toEqual("?ref=gh-pages&token=nonsense");
    });
    it("should handle an empty object", function () {
      var query_string = FourthWall.buildQueryString({});
      expect(query_string).toEqual("");
    });
  });

  describe("getToken", function () {
    beforeEach(function () {
      spyOn(FourthWall, 'getQueryVariable');
      FourthWall.getQueryVariable.plan = function(name) {
        return {
          "api.github.com_token": "com-token",
          "token": "default-token",
          "github.gds_token": "gds-token"
        }[name];
      };
    });

    it("returns correct enterprise token", function() {
      expect(FourthWall.getToken('github.gds')).toEqual("gds-token");
    });

    it("returns correct github.com token", function() {
      expect(FourthWall.getToken('api.github.com')).toEqual("com-token");
    });

    it("falls back to default token for github.com", function() {
      FourthWall.getQueryVariable.plan = function(name) {
        return {
          "api.github.com_token": false,
          "token": "default-token",
          "github.gds_token": "gds-token"
        }[name];
      };

      expect(FourthWall.getToken('api.github.com')).toEqual("default-token");
    })
  });

  describe("getTokenFromUrl", function() {
    beforeEach(function() {
      spyOn(FourthWall, 'getToken');
    });

    it("extracts github.com hostname", function() {
      FourthWall.getTokenFromUrl("http://api.github.com/foo/bar");
      expect(FourthWall.getToken).toHaveBeenCalledWith("api.github.com");
    });

    it("extracts enterprise github hostname", function() {
      FourthWall.getTokenFromUrl("http://github.gds/foo/bar");
      expect(FourthWall.getToken).toHaveBeenCalledWith("github.gds");
    });
  });

  describe("getTeams", function () {
    it("should return an array of teams", function () {
      spyOn(FourthWall, "getQueryVariables").andReturn({team: "myorg/myteam"});
      var teams = FourthWall.getTeams();

      var expected = {
        org: "myorg",
        team: "myteam",
        hostname: "api.github.com",
        baseUrl: "https://api.github.com"
      };
      expect(teams.length).toBe(1);
      expect(_.isEqual(teams[0], expected)).toEqual(true);
    });

    it("should return an array with a github enterprise team", function () {
      spyOn(FourthWall, "getQueryVariables").andReturn({"github.gds_team": "myorg/myteam"});
      var teams = FourthWall.getTeams();

      expect(teams.length).toBe(1);
      var expected = {
        org: "myorg",
        team: "myteam",
        hostname: "github.gds",
        baseUrl: "https://github.gds/api/v3"
      };
      expect(_.isEqual(teams[0], expected)).toEqual(true);
    });

    it("should return an empty array if no teams are set", function() {
      spyOn(FourthWall, "getQueryVariables").andReturn({"foo": "bar"});
      var teams = FourthWall.getTeams();
      expect(teams).toEqual([]);
    });
  });

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
        spyOn(FourthWall.Info.prototype, "fetch");
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
      it("instantiates an internal Info model", function () {
        expect(pull.info instanceof FourthWall.Info).toBe(true);
      });

      it("fetches new info data when the head changes", function () {
        pull.set('head', 'foo');
        expect(pull.info.fetch).toHaveBeenCalled();
      });

      it("triggers a change when the info changes", function () {
        var changed = false;
        pull.on('change', function () {
          changed = true;
        });
        pull.info.set('foo', 'bar');
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
      it("calculates seconds since creation date", function () {
        setupMoment("2013-09-09T10:01:00+01:00", window)
        spyOn(FourthWall.Comment.prototype, "fetch");
        spyOn(FourthWall.Status.prototype, "fetch");
        var pull = new FourthWall.Pull({
          head: {sha: 'foo'}
        }, {
          collection: {}
        });
        var result = pull.parse({ created_at: "2013-09-02T10:00:00+01:00" });
        var fullDay = 24 * 60 * 60;
        var expected = 7 * fullDay + 60;

        expect(result.elapsed_time).toBe(expected);
      });
    });
  });

  describe("Pulls", function () {
    describe("url", function () {
      it("constructs a URL from user name and repo name", function () {
        var pulls = new FourthWall.Pulls([], {
          baseUrl: 'https://api.base.url/repos',
          userName: 'foo',
          repo: 'bar'
        });
        expect(pulls.url()).toEqual('https://api.base.url/repos/foo/bar/pulls');
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

  describe("Status", function () {
    describe("parse", function () {
      it("does nothing when there are no statuses", function () {
        expect(FourthWall.Status.prototype.parse([])).toBeFalsy();
      });

      it("marks as failed when the latest status is not success and not pending", function () {
        var res = FourthWall.Status.prototype.parse([
          { state: 'error' }
        ]);
        expect(res.failed).toBeTruthy();
      });

      it("doesn't mark as failed when the latest status is success or pending", function () {
        var res = FourthWall.Status.prototype.parse([
          { state: 'pending' }
        ]);
        expect(res.failed).toBeFalsy();

        res = FourthWall.Status.prototype.parse([
          { state: 'success' }
        ]);
        expect(res.failed).toBeFalsy();
      });

      it("doesn't mark as failed when a previous status failed", function () {
        var res = FourthWall.Status.prototype.parse([
          { state: 'pending' },
          { state: 'error' }
        ]);
        expect(res.failed).toBeFalsy();
      });
    });
  });
});
