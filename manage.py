#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DATABASE_URL", "psql://fourth_wall:devpassword@localhost/fourth_wall")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fourth_wall.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
