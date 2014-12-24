from .models import Repository

from django.contrib import admin


class RepositoryAdmin(admin.ModelAdmin):
    list_display = ('hostname', 'owner', 'name',)

admin.site.register(Repository, RepositoryAdmin)
