# Fourth Wall

[![Build Status](https://travis-ci.org/alphagov/fourth-wall.png)](https://travis-ci.org/alphagov/fourth-wall)

Pure client-side pull request and build status monitor for Github repositories.

![Screenshot of Fourth Wall](https://cloud.githubusercontent.com/assets/355033/6211416/6341db4e-b5d1-11e4-99d2-57b80a400a41.png)

## How to use

The project is hosted through Github pages:
`http://alphagov.github.io/fourth-wall/?token=_token_&gist=_gist_id_`

You will need to have a Github API token with access to the relevant
repositories if you don't already have one. To do that, visit
https://github.com/settings/applications and create a new personal
access token. To use the `team` parameter you will need to give the token
the `read:org` permission.

The following query parameters are required:

 - `token`: Your Github API token

At least one of:

 - `gist`: ID of the Gist containing the list of repositories to monitor.
 - `team`: Github organisation and team name to build the list of repositories in the form `{org}/{team}` (requires the [`read:org`](https://developer.github.com/v3/orgs/) permission).
 - `team[]`: Given multiple times allows for more than one team to be used to build the list of repositories.
 - `file`: URL of a file in a Github repo that contains the list of repositories.

Optional query parameters:

 - `listinterval`: Update interval for the list of monitored repos in seconds (default: 900)
 - `interval`: Update interval for monitored repos in seconds (default: 60)
 - `filterusers`: Only show PRs from specific users, if set in config (default: false)
 - `ignore_wip`: Only show PRs which do not have a `[WIP]` tag in the title. Tag position is irrelevant.

The Gist should contain one or more JSON files with this syntax:
```json
[
  {
    "userName": "<username of the repo owner>",
    "repo": "<repository name>"
  }
]
```

You must make sure you set the language of the Gist to JSON as it will
default to Text, which will not work.

Optionally, the Gist can contain a JSON file named `users`, to list
users the team cares about. Fourth Wall can then display PRs
across your tracked apps opened by these users, if the `filterusers` param is set. Syntax:
```json
[
  "username0",
  "username1"
]
```

Optionally, entries may also contain ```"important": true``` to indicate that a
repository is important.  This has an effect only when the `filterusers` param
is set: PRs on important repositories will always be displayed, even when they
weren't opened by one of the listed users.

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

To load repositories from a team on an enterprise instance you must prefix the
hostname to the team url parameter as with the token `<hostname>_team` (or
`<hostname>_team[]` for multiple teams).
