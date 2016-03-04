#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

# This file is only used if you use `make publish` or
# explicitly specify it as your config file.

import os
import sys
sys.path.append(os.curdir)
from pelicanconf import *

SITEURL = 'https://tiborsimon.io'


FEED_ALL_ATOM = 'feeds/all.atom.xml'
CATEGORY_FEED_ATOM = 'feeds/%s.atom.xml'


#PLUGINS = ['figure-generator', 'tspr-sync', 'tspr', 'summary', 'tag_cloud', 'json-search-system', 'series', 'bootstrapify', 'donation', 'time-service', 'sitemap', 'minify']
PLUGINS += ['sitemap', 'minify']

# Following items are often useful when publishing

DISQUS_SITENAME = "tiborsimonio"
#GOOGLE_ANALYTICS = ""
