from django.conf import settings
from social.backends.github import GithubOAuth2


class GithubEnterpriseOAuth2(GithubOAuth2):
    name = 'github-enterprise'
    AUTHORIZATION_URL = 'https://{0}/login/oauth/authorize'.format(settings.GITHUB_ENTERPRISE_HOSTNAME)
    ACCESS_TOKEN_URL = 'https://{0}/login/oauth/access_token'.format(settings.GITHUB_ENTERPRISE_HOSTNAME)


    def request(self, url, method='GET', *args, **kwargs):
        # Override the request() method that's implement in the parent class.
        # GitHub Enterprise has an invalid SSL certificate, so we need to
        # explicitly tell the requests library to not validate it.
        request_options = {'verify': False}
        extended_kwargs = dict(kwargs.items() + request_options.items())
        return super(GithubOAuth2, self).request(url, method, *args, **extended_kwargs)


    def _user_data(self, access_token, path=None):
        url = 'https://{0}/api/v3/user{1}'.format(settings.GITHUB_ENTERPRISE_HOSTNAME, path or '')
        return self.get_json(url, params={'access_token': access_token})
