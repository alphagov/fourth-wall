from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string


def home(request):
    return HttpResponse(render_to_string('index.html', {}))


def repos(request):
    return JsonResponse({
        'repositories': settings.REPOSITORIES
    })
