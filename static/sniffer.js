

module.define('sniffer', function (require, exports) {

    var eventSource;
    var callbackMethod, callbackObject;

    function onMessage(event) {
	var message = JSON.parse(event.data);
	callbackMethod.call(callbackObject, message);
    }

    exports.runWithCallback = function (method, object) {
	if (eventSource) {
	    try { eventSource.close(); }
	    catch (e) { }
	}
	callbackMethod = method;
	callbackObject = object;
	eventSource = new EventSource('/events');
	// I had trouble in some browser when I used eventSource.onmessage
	eventSource['onmessage'] = onMessage;
    };

});


