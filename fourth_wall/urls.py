from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    url(r'^$', 'fourth_wall.views.home', name='home'),

    url(r'^repos/(?P<dashboard_slug>[\w\-]+)$', 'fourth_wall.views.repos', name='repos'),
    url(r'^dashboard/(?P<dashboard_slug>[\w\-]+)$', 'fourth_wall.views.dashboard', name='dashboard'),

    url(r'^admin/', include(admin.site.urls)),

    url(r'^login/$', 'fourth_wall.views.login', name='login'),
    url('', include('social.apps.django_app.urls', namespace='social')),
)
