# Fourth Wall

Pure client-side pull request and build status monitor for Github repositories that use Travis.

## How to use

The project is hosted through Github pages:
http://alphagov.github.io/fourth-wall/?token=&lt;token&gt;&amp;gist=&lt;gist_id&gt;

The following query parameters are required:
 - `token`: Your Github API token
 - `gist`: ID of the Gist containing the list of repositories to monitor

The Gist should be a JSON file with this syntax:
```json
[
  {
    "userName": "<username of the repo owner>",
    "repo": "<repository name>"
  }
]
```

For example, the GOV.UK Performance Platform team repo list can be found in [this gist](https://gist.github.com/abersager/6449384).
