#!/usr/bin/env python

# Do this first so it can load the OS-specific twisted reactor
from macosx import Sniffer

from twisted.internet import reactor
from twisted.web import server, static
from twisted.web.resource import Resource
import os.path
import sys
import json

class EventSource(Resource):

    """This class implements the server side of an EventSource.  See https://developer.mozilla.org/en/Server-sent_events/EventSource."""

    isLeaf = True

    def __init__(self, sniffer):
	Resource.__init__(self)
	self.__requests = []
	sniffer.setCallback(self.sendEvent)

    def sendEvent(self, message):
	js = json.dumps(message)
	data = '\n'.join([('data:' + line + '\n') for line in js.split('\n')]) + '\n'
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

root = static.File(os.path.join(os.path.dirname(sys.argv[0]), 'static'))
root.putChild('events', EventSource(Sniffer()))
factory = server.Site(root)
reactor.listenTCP(interface='127.0.0.1', port=8000, factory=factory)
print 'starting...'
reactor.run()

