(function () {
    var FourthWall = {};

    // http://css-tricks.com/snippets/javascript/get-url-variables/
    FourthWall.getQueryVariable = function (variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] === variable) {
                return pair[1];}
            }
        return false;
    };

    FourthWall.getToken = function (hostname) {
        var token = FourthWall.getQueryVariable(hostname+'_token');
        if (token === false && hostname == 'api.github.com') {
            token = FourthWall.getQueryVariable('token');
        }
        return token;
    };

    FourthWall.getTokenFromUrl = function (url) {
        var a = document.createElement('a');
        a.href = url;
        return FourthWall.getToken(a.hostname);
    };

    var overrideFetch = function(url) {
        return Backbone.Model.prototype.fetch.apply(this, [{
            beforeSend: setupAuthentication(url)
        }]);
    };

    var setupAuthentication = function (baseUrl) {
        return function(xhr) {
            var token = FourthWall.getTokenFromUrl(baseUrl);
            if (token !== false && token !== '') {
                xhr.setRequestHeader('Authorization', 'token ' + token);
            }
        };
    };

    var gistId = FourthWall.getQueryVariable('gist');
    // hack for SimpleHTTPServer appending a slash
    if (gistId[gistId.length-1] == '/') {
        gistId = gistId.substr(0, gistId.length - 1);
    }

    FourthWall.Comment = Backbone.Model.extend({
        parse: function (response) {
            var thumbsup = response.some(function(comment) {
                var checkFor = [":+1:", ":thumbsup:"];
                return checkFor.some(function(check) {
                    return comment.body.indexOf(check) != -1;
                })
            });
            return {
                thumbsup: thumbsup,
                numComments: response.length
            }
        },
        fetch: function() {
            return overrideFetch.call(this, this.url);
        }
    });

    FourthWall.Status = Backbone.Model.extend({

        initialize: function () {
            this.on('change:sha', function () {
                this.fetch();
            }, this);
        },

        url: function () {
            return [
                this.get('baseUrl'),
                this.get('userName'),
                this.get('repo'),
                'statuses',
                this.get('sha')
            ].join('/')
        },

        fetch: function() {
            return overrideFetch.call(this, this.get('baseUrl'));
        },

        parse: function (response) {
            if (!response.length) {
                return;
            }
            var data = response[0];
            data.created_at = moment(data.created_at);
            data.failed = data.state !== 'success' && data.state !== 'pending';
            return data;
        }
    });

    FourthWall.Info = Backbone.Model.extend({

        initialize: function () {
            this.on('change:sha', function () {
                this.fetch();
            }, this);
        },

        url: function () {
            return [
                this.get('baseUrl'),
                this.get('userName'),
                this.get('repo'),
                'pulls',
                this.get('pullId')
            ].join('/')
        },

        fetch: function() {
            return overrideFetch.call(this, this.get('baseUrl'));
        }
    });

    FourthWall.MasterStatus = FourthWall.Status.extend({
        url: function () {
            return [
                this.get('baseUrl'),
                this.get('userName'),
                this.get('repo'),
                'statuses',
                'master'
            ].join('/')
        }
    });


    FourthWall.Repo = Backbone.Model.extend({
        defaults: {
            'baseUrl': 'https://api.github.com/repos'
        },

        initialize: function () {
            this.master = new FourthWall.MasterStatus({
                baseUrl: this.get('baseUrl'),
                userName: this.get('userName'),
                repo: this.get('repo')
            });

            this.master.on('change:failed', function () {
                this.trigger('change');
            }, this);

            this.pulls = new FourthWall.Pulls([], {
                baseUrl: this.get('baseUrl'),
                userName: this.get('userName'),
                repo: this.get('repo')
            });

            this.pulls.on('reset add remove', function () {
                this.trigger('change');
            }, this);
        },

        fetch: function () {
            this.pulls.fetch();
            this.master.fetch();
        }

    });

    FourthWall.Repos = Backbone.Collection.extend({

        model: FourthWall.Repo,

        initialize: function () {
          this.on('reset add remove', function () {
            this.fetch();

            this.each(function (model) {
                model.off();
                model.on('change', function () {
                    this.trigger('change');
                }, this);
            }, this);
          }, this);
        },

        schedule: function () {
            var listInterval = FourthWall.getQueryVariable('listinterval') || 900;
            var statusInterval = FourthWall.getQueryVariable('interval') || 60;
            this.updateList();
            setInterval(_.bind(function () {
              this.updateList();
            }, this), listInterval * 1000);
            setInterval(_.bind(function () {
              this.fetch();
            }, this), statusInterval * 1000);
        },

        updateList: function () {
            var that = this;
            var passed_token = FourthWall.getToken('api.github.com'); // from URL params
            var optional_param = '';
            if (passed_token !== false && passed_token !== "") {
                optional_param = '?access_token=' + passed_token;
            }
            $.ajax({
                url: 'https://api.github.com/gists/' + gistId + optional_param,
                type: 'GET',
                dataType: 'jsonp',
                success: function (gistdata) {
                    var objects = [];
                    for (file in gistdata.data.files) {
                        if (gistdata.data.files.hasOwnProperty(file)) {
                            var filedata = gistdata.data.files[file],
                                lang = filedata.language;

                            if (lang == 'JavaScript' || lang == 'JSON' || lang == null) {
                                var o = JSON.parse(filedata.content);
                                if (o) {
                                    objects.push(o);
                                }
                            }
                            if (lang == 'CSS') {
                                var $custom_css = $('<style>');
                                $custom_css.text( filedata.content );
                                $('head').append( $custom_css );
                            }
                        }
                    }
                    if (objects.length > 0) {
                        that.reset.call(that, objects[0]);
                    }
                }
            });
        },

        fetch: function () {
            this.each(function (model) {
                model.fetch();
            }, this);
        }

    });

    FourthWall.Pull = Backbone.Model.extend({
        initialize: function () {
            this.set('repo', this.collection.repo);
            this.comment = new FourthWall.Comment();
            this.comment.url = this.get('comments_url');
            this.on('change:comments_url', function () {
                this.comment.url = this.get('comments_url');
                this.comment.fetch();
            }, this);
            this.comment.on('change', function () {
                this.trigger('change');
            }, this);
            this.status = new FourthWall.Status({
                baseUrl: this.collection.baseUrl,
                userName: this.collection.userName,
                repo: this.get('repo'),
                sha: this.get('head').sha
            });
            this.on('change:head', function () {
                this.status.set('sha', this.get('head').sha);
            }, this);
            this.status.on('change', function () {
                this.trigger('change');
            }, this);
            this.info = new FourthWall.Info({
                baseUrl: this.collection.baseUrl,
                userName: this.collection.userName,
                repo: this.get('repo'),
                pullId: this.get('number')
            }),
            this.on('change:head', function () {
                this.info.set('sha', this.get('head').sha);
            }, this);
            this.info.on('change', function () {
                this.trigger('change');
            }, this);
            this.fetch();
        },

        fetch: function () {
            this.status.fetch();
            this.comment.fetch();
            this.info.fetch();
        },

        parse: function (data) {
            data.elapsed_time = this.elapsedSeconds(data.created_at);
            return data;
        },

        elapsedSeconds: function (created_at) {
            var now = moment();
            created_at = moment(created_at);
            return now.unix() - created_at.unix();
        }
    });

    FourthWall.Pulls = Backbone.Collection.extend({

        model: FourthWall.Pull,

        initialize: function (models, options) {
            this.baseUrl = options.baseUrl;
            this.userName = options.userName;
            this.repo = options.repo;
        },

        url: function () {
            return [
                this.baseUrl,
                this.userName,
                this.repo,
                'pulls'
            ].join('/');
        },

        fetch: function() {
            return overrideFetch.call(this, this.baseUrl);
        }
    });

    FourthWall.ListItems = Backbone.Collection.extend({

        initialize: function (models, options) {
            this.repos = options.repos;
            this.repos.on('change', function () {
                this.fetch();
            }, this);
        },

        isMaster: function (x) {
            return x instanceof FourthWall.MasterStatus;
        },

        isThumbsUp: function (x) {
            return x.comment.get('thumbsup');
        },

        compare: function (f, a, b) {
            if (f(a) && f(b)) {
                return 0;
            } else if (f(a)) {
                return -1;
            } else if (f(b)) {
                return 1;
            }
        },

        cmp: function(a, b) {
            if (!a && !b) return 0;
            if (!a) return 1;
            if (!b) return -1;
            if (a > b) return -1;
            if (b > a) return 1;
            return 0;
        },

        comparator: function (a, b) {
            
            var res = this.compare(this.isMaster, a, b);
            if (res != null) {
                return res;
            }

            res = this.compare(this.isThumbsUp, a, b);
            if (res != null) {
                return res;
            }

            var timeA = a.get('elapsed_time'),
                timeB = b.get('elapsed_time');

            if ( FourthWall.getQueryVariable('recent') ) {
                return this.cmp(timeB, timeA);
            }
            else {
                return this.cmp(timeA, timeB);
            }
        },

        fetch: function () {
            var models = [];
            this.repos.each(function (repo) {
                repo.pulls.each(function (pull) {
                    models.push(pull);
                });
                if (repo.master.get('failed')) {
                    models.push(repo.master);
                }
            }, this);
            this.reset(models);
        }
    });

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

            if (this.model.comment.get('thumbsup')) {
                this.$el.addClass("thumbsup");
            }

            var suffix = "";
            if (this.model.comment.get('numComments') !== 1) {
                suffix = "s";
            }

            if (this.model.info.get('mergeable') === false){
                var statusString = '<p class="status not-mergeable">No auto merge</p>';
            } else if (this.model.status.get('state')){
                var state = this.model.status.get('state');
                var statusString = '<p class="status ' + state + '">Status: ' + state + '</p>';
            } else {
                var statusString = '<p class="status">No status</p>';
            }

            var commentCount = 0;
            if (this.model.comment.get('numComments')){
                commentCount = commentCount + this.model.comment.get('numComments');
            }
            if (this.model.info.get('review_comments')){
                commentCount = commentCount + this.model.info.get('review_comments');
            }

            this.$el.html([
                '<img class="avatar" src="', this.model.get('user').avatar_url, '" />',
                statusString,
                '<h2>', this.model.get('repo'), '</h2>',
                '<div class="elapsed-time" data-created-at="',
                this.model.get('created_at'),
                '">',
                this.secondsToTime(this.model.get('elapsed_time')),
                '</div>',
                '<p><a href="', this.model.get('html_url'), '">',
                '<span class="username">',this.model.get('user').login,'</span>',
                ': ',
                this.escape(this.model.get('title')),
                ' (#',
                this.model.get('number'),
                ')',
                '</a></p>',
                '<p class="comments"> ' + commentCount + " comment" + suffix + '</p>',
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
            return days + ' ' + hours + 'h ' + minutes + 'm';
        }
    });

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
                view.render();
                view.$el.appendTo(this.$el);
                this.lis.push(view);
            }, this);
            if (this.lis.length) {
              $('#all-quiet').hide();
            } else {
              $('#all-quiet').show();
            }
        }
    });

    window.FourthWall = FourthWall;
})();
