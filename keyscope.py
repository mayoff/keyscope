#!/usr/bin/env python

# Do this first so it can load the OS-specific twisted reactor
from macosx import EventsPage

from twisted.internet import reactor
from twisted.web import server, static
import os.path
import sys

root = static.File(os.path.join(os.path.dirname(sys.argv[0]), 'static'))
root.putChild('events', EventsPage());
factory = server.Site(root)
reactor.listenTCP(interface='127.0.0.1', port=8000, factory=factory)
reactor.run()

