# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import re
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('fourth_wall', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Dashboard',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('slug', models.CharField(unique=True, max_length=50, validators=[django.core.validators.RegexValidator(re.compile('^[-a-zA-Z0-9_]+$'), "Enter a valid 'slug' consisting of letters, numbers, underscores or hyphens.", 'invalid')])),
                ('repositories', models.ManyToManyField(to='fourth_wall.Repository', blank=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
