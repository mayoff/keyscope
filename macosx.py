

from twisted.internet import cfreactor
cfreactor.install()

from twisted.web.resource import Resource
from twisted.web import server
from twisted.internet import task, reactor
import time

class EventsPage(Resource):
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

