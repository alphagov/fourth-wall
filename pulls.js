$(document).ready(function() {
    // http://css-tricks.com/snippets/javascript/get-url-variables/
    function getQueryVariable (variable) {
           var query = window.location.search.substring(1);
           var vars = query.split("&");
           for (var i=0;i<vars.length;i++) {
                   var pair = vars[i].split("=");
                   if(pair[0] == variable){return pair[1];}
           }
           return(false);
    }

    var token = getQueryVariable('token');
    var gistId = getQueryVariable('gist');

    $.ajaxSetup({
        headers: {
            'Authorization': 'token ' + token
        }
    });

    var Comment = Backbone.Model.extend({
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
        }
    });

    var Status = Backbone.Model.extend({
      parse: function (response) {
        if (!response.length) {
          return;
        }
        return response[0];
      }
    });

    var Repo = Backbone.Model.extend({

        initialize: function () {
            this.comment = new Comment();
            this.on('change:comments_url', function () {
                this.comment.url = this.get('comments_url');
                this.comment.fetch();
            }, this);
            this.comment.on('change', function () {
                this.trigger('change');
            }, this);

            this.status = new Status();
            this.on('change:head', function () {
                this.status.url = [
                    this.baseUrl,
                    this.get('userName'),
                    this.get('repo'),
                    'statuses',
                    this.get('head').sha
                ].join('/');
                this.status.fetch()
            }, this);
            this.status.on('change', function () {
                this.trigger('change');
            }, this);
        },

        baseUrl: 'https://api.github.com/repos',

        url: function () {
            return [
                this.baseUrl,
                this.get('userName'),
                this.get('repo'),
                'pulls'
            ].join('/');
        },

        parse: function (response) {
            if (!response.length) {
              return {}; 
            }
            var data = response[0];
            data.elapsed_time = this.elapsedSeconds(data.created_at);
            return data;
        },

        startOfWorkingDay: function (date) {
            return moment(date).startOf('day').hours(9).minutes(30);
        },

        endOfWorkingDay: function (date) {
            return moment(date).startOf('day').hours(17).minutes(30);
        },

        workingTimeForDay: function (date, options) {
            options = options || {};
            date = moment(date).startOf('day');
            var isWeekend = date.day() === 0 || date.day() === 6;
            if (isWeekend) {
                return 0;
            }
            var min = Math.max(+(options.min || 0), +this.startOfWorkingDay(date));
            var max = Math.min(+(options.max || Infinity), +this.endOfWorkingDay(date));
            return Math.max((max - min) / 1000, 0);
        },

        elapsedSeconds: function (created_at) {
            var now = moment();
            created_at = moment(created_at);

            var elapsed = 0;
            var date = moment(created_at).startOf('day');
            while (date < now) {
                elapsed += this.workingTimeForDay(date, {
                    min: created_at,
                    max: now
                });
                date.add(1, 'days');
            }

            return elapsed;
        }
    });

    var Repos = Backbone.Collection.extend({

        model: Repo,

        initialize: function () {
          this.on('reset add remove', function () {
            this.fetch();
            this.each(function (model) {
                model.on('change', function () {
                  this.sort();
                }, this);
            }, this);
          }, this);
        },

        updateList: function () {
            var that = this;
            $.ajax({
                url: 'https://api.github.com/gists/' + gistId + '?access_token=' + token,
                type: 'GET',
                dataType: 'jsonp',
                success: function (gistdata) {
                    var objects = [];
                    for (file in gistdata.data.files) {
                        if (gistdata.data.files.hasOwnProperty(file)) {
                            var o = JSON.parse(gistdata.data.files[file].content);
                            if (o) {
                                objects.push(o);
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
        },

        comparator: function (a, b) {
            var timeA = a.get('elapsed_time'),
                timeB = b.get('elapsed_time');
            if (!timeA && !timeB) {
              return 0;
            } else if (!timeA) {
              return 1;
            } else if (!timeB) {
              return -1;
            } else {
              return timeA > timeB ? -1 : (timeA < timeB ? 1 : 0);
            }
        }
    });

    var RepoView = Backbone.View.extend({
        tagName: 'li',

        initialize: function () {
          this.model.on('change', this.render, this);
        },

        render: function () {
            var pullId = 'pull-' + this.model.id;
            this.$el.removeClass();
            this.$el.addClass(this.ageClass(this.model.get('elapsed_time')));

            if (this.model.comment.get('thumbsup')) {
                this.$el.addClass("thumbsup");
            }

            var suffix = "";
            if (this.model.comment.get('numComments') !== 1) {
                suffix = "s";
            }

            if (this.model.status.get('state')){
                var state = this.model.status.get('state');
                var statusString = '<p class="status ' + state + '">Status: ' + state + '</p>';
            } else {
                var statusString = '<p class="status">No status</p>';
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
                this.model.get('title'),
                ' (#',
                this.model.get('number'),
                ')',
                '</a></p>',
                '<p class="comments"> ' + this.model.comment.get('numComments') + " comment" + suffix + '</p>',
            ].join(''));
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

    var RepoListView = Backbone.View.extend({
        initialize: function () {
            this.collection.on('sort reset add remove', this.render, this);
        },

        render: function () {
            this.$el.empty();
            this.lis = [];
            this.collection.each(function (model) {
              if (model.get('head')) {
                var view = new RepoView({
                    model: model,
                    list: this
                });
                view.render();
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

    var repos = new Repos();
    var repoListView = new RepoListView({
        el: $('#pulls'),
        collection: repos
    })
    repos.updateList();
    setInterval(_.bind(function () {
      repos.updateList();
    }, this), 900000);
    setInterval(_.bind(function () {
      repos.fetch();
    }, this), 30000);
});

