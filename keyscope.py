#!/usr/bin/python

from twisted.internet import reactor, protocol
from twisted.web import server, static
from twisted.web.resource import Resource
import os
import os.path
import signal
import sys

class EventSource(Resource):

    """This class implements the server side of an EventSource.  See https://developer.mozilla.org/en/Server-sent_events/EventSource."""

    isLeaf = True

    def __init__(self):
	Resource.__init__(self)
	self.__requests = []

    def send(self, data):
	for r in self.__requests:
	    r.write(data)

    def render_GET(self, request):
	request.notifyFinish().addErrback(self.__requestDidTerminate, request)
	self.__requests.append(request)
	request.setHeader('Content-Type', 'text/event-stream')
	request.setHeader('Cache-Control', 'no-cache')
	request.setHeader('Connection', 'keep-alive')
	return server.NOT_DONE_YET

    def __requestDidTerminate(self, err, request):
	self.__requests.remove(request)


class SnifferProtocol(protocol.ProcessProtocol):

    def __init__(self, callback):
	self.__callback = callback

    def outReceived(self, data):
	self.__callback(data)

    def outConnectionLost(self):
	print 'sniffer hung up'
	reactor.crash()

    def processExited(self, status):
	print 'sniffer died'
	reactor.crash()

print os.path.dirname(sys.argv[0])
os.chdir(os.path.dirname(sys.argv[0]))
root = static.File('static')
eventSource = EventSource()
sniffer = SnifferProtocol(eventSource.send)
reactor.spawnProcess(sniffer, './sniffer-macosx.py', ['./sniffer-macosx.py'])
root.putChild('events', eventSource)
factory = server.Site(root)
reactor.listenTCP(interface='127.0.0.1', port=8000, factory=factory)
signal.signal(signal.SIGINT, signal.SIG_DFL)
signal.signal(signal.SIGTERM, signal.SIG_DFL)
print 'starting...'
reactor.run()

