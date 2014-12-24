# Fourth Wall

[![Build Status](https://travis-ci.org/alphagov/fourth-wall.png)](https://travis-ci.org/alphagov/fourth-wall)

Fourth Wall is a Django application for displaying open pull requests
and build status on a monitor.

## Configuration

You need to pass a query parameter when making a request to the application:

- `token`, a [GitHub personal access token](https://github.com/settings/applications)

Optional query parameters:

- `listinterval`, the update interval for the list of monitored repos in seconds
- `interval`, the update interval for monitored repos in seconds

Repositories are stored in the database and modified with the Django admin interface.

### Support for GitHub Enterprise

If you want to use GitHub Enterprise you must pass in a token for that hostname
as a query parameter, of the form `<hostname>_token`.

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
