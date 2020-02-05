function runPreFlightChecks() {
  const isHttp      = window.location.protocol == 'http:',
        isLocalhost = window.location.hostname == 'localhost'
        isUnsafe    = isHttp && !isLocalhost;

  if (isUnsafe) {
    const isHttpMessage = [
      'This page is running over the web over HTTP.',
      'You should use HTTPS and rotate your access token.',
    ].join(' ');
    alert(isHttpMessage);
  }

  // We will:
  // - Make a request to the github rate limit endpoint
  //   (This will not affect the rate limit)
  // - Check what scopes we have access to
  const queryVars         = new FourthWall.getQueryVariables(),
        token             = queryVars.token,
        extraScopes       = (queryVars.extra_scopes || '').split(',').filter(
          function(scope) { return scope.length > 0 }
        ),
        ghUrl             = 'https://api.github.com/rate_limit',

  fetch(ghUrl, {
    headers: {
      'Authorization': 'token ' + token
    }
  })
    .then(function (response) { return response.headers; })
    .then(function (headers)  { return headers.get('x-oauth-scopes')  })
    .then(function (scopes)   { return scopes.split(', '); })
    .then(function (scopes)   {
      const allowedScopes = [
        'repo:status', 'repo_deployment', 'read:org'
      ].concat(extraScopes);
      let badScopes = scopes.filter(function(scope) {
        return allowedScopes.indexOf(scope) < 0;
      });

      if (badScopes.length > 0) {
        let badScopesString = badScopes.join(' '),
            badScopesMessage = [
              'You have the following unnecessary scopes: <',
              badScopesString,
              '>; these scopes should be removed.',
              'Clicking accept will reload this page.',
              'Reloading the page will show this message unless the scopes are correct.',
            ].join(' ');

        alert(badScopesMessage);
        window.location.reload(true);
      }
    });
}
