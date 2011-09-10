#!/usr/bin/env python

# http://zenmachine.wordpress.com/2009/09/19/twisted-and-comet-comet-in-60-seconds/

from twisted.internet import cfreactor
cfreactor.install()

from twisted.internet import reactor, task
from twisted.web import server
from twisted.web.server import Site
from twisted.web.resource import Resource
import time

class LongPollPage(Resource):
    isLeaf = True

    def __init__(self):
        self.__requests = []
        loopingCall = task.LoopingCall(self.__print_time)
        loopingCall.start(1, False)
        Resource.__init__(self)

    def render_GET(self, request):
        request.write('<b>%s</b>' % (time.ctime(),))
        request.notifyFinish().addErrback(self.__requestTerminated, request)
        self.__requests.append(request)
        return server.NOT_DONE_YET

    def __print_time(self):
        for r in self.__requests:
            r.write('<b>%s</b>' % (time.ctime(),))

    def __requestTerminated(self, err, request):
        self.__requests.remove(request)
        if not self.__requests:
            reactor.stop()

resource = LongPollPage()
factory = Site(resource)
reactor.listenTCP(interface='127.0.0.1', port=8000, factory=factory)
reactor.run()

