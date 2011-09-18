

module.define('sniffer', function (require, exports) {

    var bus = require('messagebus');
    exports.kKeyDownSubject = 'keydown';
    exports.kKeyUpSubject = 'keyup';

    var eventSource;

    function onMessage(event) {
	var message = JSON.parse(event.data);
	var subject = message.action === 'up' ? kKeyUpSubject : kKeyDownSubject;
	bus.publish(subject, message);
    }

    exports.run = function () {
	if (eventSource) {
	    try { eventSource.close(); }
	    catch (e) { }
	}
	eventSource = new EventSource('/events');
	// I had trouble in some browser when I used eventSource.onmessage
	eventSource['onmessage'] = onMessage;
    };

});


