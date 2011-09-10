

# cfreactor uses the Mac's CFRunLoop, which is required to use an event tap
from twisted.internet import cfreactor
cfreactor.install()

from twisted.web.resource import Resource
from twisted.web import server
from twisted.internet import task, reactor

# Quartz is part of PyObjC, which comes standard on at least Mac OS X 10.6 and 10.7.
from Quartz import *

class EventsPage(Resource):
    isLeaf = True

    def __init__(self):
        Resource.__init__(self)
        self.__requests = []
        self.__initEventTap()

    def __initEventTap(self):
        eventMask = (0
            | CGEventMaskBit(kCGEventKeyDown)
            | CGEventMaskBit(kCGEventKeyUp)
            | CGEventMaskBit(kCGEventFlagsChanged)
        )
        tap = CGEventTapCreate(kCGAnnotatedSessionEventTap, kCGHeadInsertEventTap, kCGEventTapOptionListenOnly, eventMask, self.__onTapEvent, None)
        source = CFMachPortCreateRunLoopSource(None, tap, 0);
        CFRunLoopAddSource(CFRunLoopGetCurrent(), source, kCFRunLoopCommonModes)
        CGEventTapEnable(tap, True)

    def __onTapEvent(self
        , proxy # CGEventTapProxy
        , type # CGEventType
        , event # CGEventRef
        , context # void*
    ):
        if type == kCGEventKeyDown:
            type = 'kCGEventKeyDown'
        elif type == kCGEventKeyUp:
            type = 'kCGEventKeyUp'
        elif type == kCGEventFlagsChanged:
            type = 'kCGEventFlagsChanged'
        else:
            return

        self.__send(type)

    def __send(self, content):
        data = '\n'.join([('data:' + line + '\n') for line in content.split('\n') ]) + '\n'
        for r in self.__requests:
            r.write(data)

    def render_GET(self, request):
        request.notifyFinish().addErrback(self.__requestTerminated, request)
        self.__requests.append(request)
        request.setHeader('Content-Type', 'text/event-stream')
        request.setHeader('Cache-Control', 'no-cache')
        request.setHeader('Connection', 'keep-alive')
        return server.NOT_DONE_YET

    def __requestTerminated(self, err, request):
        self.__requests.remove(request)
