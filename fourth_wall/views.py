from .models import Repository

from django.http import JsonResponse
from django.shortcuts import redirect, render


def home(request):
    if request.user.is_authenticated() and request.user.is_staff:
        return redirect('admin:index')

    if not request.user.is_authenticated():
        return redirect('login')

    return render(request, 'index.html')


def repos(request):
    parsed_repos = []

    if not request.user.is_authenticated():
        return JsonResponse({
            'message': 'Authenticate with GitHub before requesting repos.'
        }, status=401)

    authenticated_auth = request.user.social_auth.all()

    def github_api_url_for_hostname(hostname):
        if hostname == 'github.com':
            return 'https://api.github.com/repos'
        else:
            return 'https://{0}/api/v3/repos'.format(hostname)

    def token_for_hostname(hostname, auths):
        if hostname == 'github.com':
            github_auth = [auth for auth in auths if auth.provider == 'github-org']
        else:
            github_auth = [auth for auth in auths if auth.provider == 'github-enterprise']

        if github_auth:
            token = github_auth[0].tokens
        else:
            token = None

        return token

    for repo in Repository.objects.all():
        parsed_repo = {
            'baseUrl': github_api_url_for_hostname(repo.hostname),
            'userName': repo.owner,
            'repo': repo.name,
            'token': token_for_hostname(repo.hostname, authenticated_auth),
        }

        parsed_repos.append(parsed_repo)

    return JsonResponse({
        'repositories': parsed_repos,
    })


def login(request):
    linked_services = []

    if request.user.is_authenticated():
        if request.user.social_auth.all():
            social_auth = request.user.social_auth.all()
            linked_services = [auth.provider for auth in social_auth]

    if 'github-org' in linked_services and 'github-enterprise' in linked_services:
        return redirect('home')
    else:
        return render(request, 'login.html', {'linked_services': linked_services})
