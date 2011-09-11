

(function () {

    var require = module.require;
    var keys$ = {};

    var heatmapGradient = [
        [ 0, 0, 0, 255, 0 ],
        [ .45, 0, 0, 255, .7 ],
        [ .55, 0, 255, 255, .7 ],
        [ .65, 0, 255, 0, .7 ],
        [ .95, 255, 255, 0, .7 ],
        [ 1.0, 255, 0, 0, .7 ]
    ];

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
            html += format('<div class="key keyup" id="key_{name}" style="left:{x}mm;top:{y}mm;width:{width}mm;height:{height}mm">{label}</div>\n', key);
        });
        var keyboard$ = $('#keyboard');
        keyboard$.width(keyboard.width + 'mm');
        keyboard$.height(keyboard.height + 'mm');
        $('#keyboard')[0].innerHTML = html;
        keyboard.keys.forEach(function (key) {
            keys$[key.name] = $('#key_' + key.name);
        });
    }

    function onSnifferMessage(event) {
        var message = JSON.parse(event.data);
        var key$ = keys$[message.key];
        if (!key$)
            return;
        if (message.action === 'up') {
            key$.removeClass('keydown');
            key$.addClass('keyup');
        } else {
            key$.removeClass('keyup');
            key$.addClass('keydown');

            countKeypress(message.key);
        }
    }

    var maxKeyPressCount = 0;
    var keyPressCounts = {};

    function countKeypress(key) {
        var count = 1 + (keyPressCounts[key] || 0);
        keyPressCounts[key] = count;
        if (count > maxKeyPressCount) {
            maxKeyPressCount = count;
            adjustAllKeyColors();
        } else {
            adjustKeyColor(key);
        }
    }

    function adjustAllKeyColors() {
        for (key in keyPressCounts) {
            if (keyPressCounts.hasOwnProperty(key))
                adjustKeyColor(key);
        }
    }

    function adjustKeyColor(key) {
        keys$[key].css('background-color', sampleGradient(heatmapGradient, keyPressCounts[key] / maxKeyPressCount));
    }

    function sampleGradient(gradient, x) {
        for (var i = gradient.length; i--; ) {
            if (gradient[i][0] <= x)
                break;
        }

        var startRow = gradient[i] || gradient[0];
        var endRow = gradient[i+1] || gradient[gradient.length - 1];
        var divisor = endRow[0] - startRow[0];
        x = (divisor === 0) ? 0 : (x - startRow[0]) / divisor;
        var x1 = 1 - x;
        var c = [];
        for (i = 1; i < 4; ++i) {
            c.push(Math.round(x1 * startRow[i] + x * endRow[i]));
        }
        c.push(x1 * startRow[4] + x * endRow[4]);
        return 'rgba(' + c.join(',') + ')';
    }

    $(document).ready(main);

})();

