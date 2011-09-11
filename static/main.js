

(function () {

    var require = module.require;

    function main() {
        initKeyboardView();
        var sniffer = new EventSource('/events');
        sniffer['onmessage'] = onSnifferMessage;
    }

    function initKeyboardView() {
        var html = '';
        var format = require('string').format;
        var keyboard = require('keyboards/apple').keyboard();
        keyboard.keys.forEach(function (key) {
            html += format('<div class="key" id="key_{name}" style="left:{x}mm;top:{y}mm;width:{width}mm;height:{height}mm"><div class="keylabel">{label}</div></div>\n', key);
        });
        var keyboard$ = $('#keyboard');
        keyboard$.width(keyboard.width + 'mm');
        keyboard$.height(keyboard.height + 'mm');
        $('#keyboard')[0].innerHTML = html;
    }

    function onSnifferMessage(event) {
        console.log(event);
    }

    $(document).ready(main);

})();

