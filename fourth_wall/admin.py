from .models import Dashboard, Repository

from django.contrib import admin


class DashboardAdmin(admin.ModelAdmin):
    list_display = ('slug',)


class RepositoryAdmin(admin.ModelAdmin):
    list_display = ('hostname', 'owner', 'name',)


admin.site.register(Dashboard, DashboardAdmin)
admin.site.register(Repository, RepositoryAdmin)
