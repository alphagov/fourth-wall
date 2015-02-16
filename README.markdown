# Fourth Wall

[![Build Status](https://travis-ci.org/alphagov/fourth-wall.png)](https://travis-ci.org/alphagov/fourth-wall)

Pure client-side pull request and build status monitor for Github repositories that use Travis.

![Screenshot of Fourth Wall](https://cloud.githubusercontent.com/assets/355033/6211416/6341db4e-b5d1-11e4-99d2-57b80a400a41.png)

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


The Gist should contain one or more JSON files with this syntax:
```json
[
  {
    "userName": "<username of the repo owner>",
    "repo": "<repository name>"
  }
]
```

Optionally, the Gist can contain a JSON file named `users`, to list
users the team cares about. Fourth Wall will then only display PRs
across your tracked apps opened by these users. Syntax:
```json
[
  "username0",
  "username1"
]
```

If the Gist contains a file with the language set to `CSS`, it will be injected
into a `<style>` block in the document head, so you can override the default
styling without having to fork this repo.

Examples:

* A simple list of repos for the [Performance Platform team](https://gist.github.com/abersager/6449384)
* A list of repos and custom CSS for the [Mainstream team](https://gist.github.com/norm/7248264)
* A list of repos, custom CSS and users for the [Core team](https://gist.github.com/issyl0/70cf0c8f3d0b1ccd2f6e)

## Support for other githubs

If you use github enterprise you must add the `baseUrl` to each repo object and
add a token for that hostname. The url parameter for the other hostname should
 be of the form `<hostname>_token`.

An example enterprise repository.

```json
[
  {
    "baseUrl": "https://myhost.com/api/v3/repos",
    "userName": "<username of the repo owner>",
    "repo": "<repository name>"
  }
]
```
