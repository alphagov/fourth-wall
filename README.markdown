# Fourth Wall

Pure client-side pull request and build status monitor for Github repositories that use Travis.

## How to use

The project is hosted through Github pages:
`http://alphagov.github.io/fourth-wall/?token=_token_&gist=_gist_id_`

You will need to have a Github API token with access to the relevant
repositories if you don't already have one. To do that, visit
https://github.com/settings/applications and create a new personal
access token.

The following query parameters are required:
 - `token`: Your Github API token
 - `gist`: ID of the Gist containing the list of repositories to monitor

Optional query parameters:
 - `listinterval`: Update interval for the list of monitored repos in seconds (default: 900)
 - `interval`: Update interval for monitored repos in seconds (default: 60)


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
