#!/usr/bin/env python

# http://zenmachine.wordpress.com/2009/09/19/twisted-and-comet-comet-in-60-seconds/

from twisted.internet import reactor, task, cfreactor
from twisted.web.server import Site
from twisted.web import server
from twisted.web.resource import Resource
import time

class ClockPage(Resource):
    isLeaf = True

    def __init__(self):
        self.presence = []
        loopingCall = task.LoopingCall(self.__print_time)
        loopingCall.start(1, False)
        Resource.__init__(self)

    def render_GET(self, request):
        request.write('<b>%s</b>' % (time.ctime(),))
        self.presence.append(request)
        return server.NOT_DONE_YET

    def __print_time(self):
        for p in self.presence:
            p.write('<b>%s</b>' % (time.ctime(),))

resource = ClockPage()
factory = Site(resource)
reactor.listenTCP(8000, factory)
reactor.run()

