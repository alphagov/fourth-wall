from .models import Repository

from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string


def home(request):
    return HttpResponse(render_to_string('index.html', {}))


def repos(request):
    parsed_repos = []

    for repo in Repository.objects.all():
        parsed_repo = {
            'userName': repo.owner,
            'repo': repo.name,
        }

        if repo.hostname != 'github.com':
            parsed_repo['baseUrl'] = 'https://{0}/api/v3/repos'.format(repo.hostname)

        parsed_repos.append(parsed_repo)

    return JsonResponse({
        'repositories': parsed_repos,
    })
