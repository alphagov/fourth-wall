from django.core.validators import validate_slug
from django.db import models


class Dashboard(models.Model):
    slug = models.CharField(
        max_length=50,
        unique=True,
        validators=[validate_slug]
    )

    repositories = models.ManyToManyField('Repository', blank=True)

    def __unicode__(self):
        return '{0}'.format(self.slug)


class Repository(models.Model):
    class Meta:
        unique_together = (
            ('hostname', 'owner', 'name'),
        )
        verbose_name_plural = 'repositories'

    hostname = models.CharField(max_length=50)
    owner = models.CharField(max_length=100)
    name = models.CharField(max_length=200)

    def __unicode__(self):
        return '{0}/{1} at {2}'.format(self.owner, self.name, self.hostname)
