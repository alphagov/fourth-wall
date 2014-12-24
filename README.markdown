# Fourth Wall

[![Build Status](https://travis-ci.org/alphagov/fourth-wall.png)](https://travis-ci.org/alphagov/fourth-wall)

Fourth Wall is a Django application for displaying open pull requests
and build status on a monitor.

## Configuration

You need to pass a few query parameters when making a request to the application:

- `token`, a [GitHub personal access token](https://github.com/settings/applications)
- `gist`, the ID of a GitHub Gist that contains a list of repositories

Optional query parameters:

- `listinterval`, the update interval for the list of monitored repos in seconds
- `interval`, the update interval for monitored repos in seconds

### The list of repositories

The list of repos you want to display should be in a Gist that looks a bit like this:

```json
[
  {
    "userName": "<username of the repo owner>",
    "repo": "<repository name>"
  }
]
```

If the Gist contains a file with the language set to `CSS`, it will be injected
into a `<style>` block in the document head, so you can override the default
styling without having to fork this repo.

#### Support for GitHub Enterprise

If you want to use GitHub Enterprise you must add a `baseUrl` to each GHE repo object and
add a token for that hostname as a query parameter, of the form `<hostname>_token`.

An example enterprise repository:

```json
[
  {
    "baseUrl": "https://myhost.github/api/v3/repos",
    "userName": "<username of the repo owner>",
    "repo": "<repository name>"
  }
]
```

Would require a query parameter of:

```
myhost.github_token=SUPER_SECRET_TOKEN
```

## Running locally

Create a PostgreSQL database:

```sql
CREATE DATABASE fourth_wall;
CREATE USER fourth_wall WITH SUPERUSER PASSWORD 'devpassword';
```

Install dependencies, set up the database and generate static files:

```bash
virtualenv venv/
. venv/bin/activate
pip install -r requirements.txt
python manage.py syncdb
python manage.py collectstatic
```

Run the app with foreman:

```bash
python manage.py runserver 0.0.0.0:5000
```

## Deploying to Heroku

```bash
heroku create
git push heroku master
```
