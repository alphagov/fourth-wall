# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Repository',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('hostname', models.CharField(max_length=50)),
                ('owner', models.CharField(max_length=100)),
                ('name', models.CharField(max_length=200)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterModelOptions(
            name='repository',
            options={'verbose_name_plural': 'repositories'},
        ),
        migrations.AlterUniqueTogether(
            name='repository',
            unique_together=set([('hostname', 'owner', 'name')]),
        ),
    ]
