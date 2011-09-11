

(function () {

    var require = module.require;
    var keys$ = {};

    var gradientSamples = [];

    function main() {
        initGradientSamples();
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

    var keyPressCounts = {};
    var keysPressed = [];

    function countKeypress(key) {
        if (!keyPressCounts.hasOwnProperty(key)) {
            keysPressed.push(key);
            keyPressCounts[key] = 1;
        }
        else ++keyPressCounts[key];

        keysPressed.sort(function (a, b) { return keyPressCounts[a] - keyPressCounts[b]; });
        var kl = keysPressed.length - 1;
        var gl = gradientSamples.length - 1;
        for (var i = 0; i <= kl; ++i)
            keys$[keysPressed[i]].css('background-color', gradientSamples[Math.floor(gl * i / kl)]);
    }

    function initGradientSamples() {
        var gradient = [
            [ 0, 0, 0, 255, 0 ],
            [ .39, 0, 0, 255, .5 ],
            [ .59, 0, 192, 192, .5 ],
            [ .79, 0, 255, 0, .5 ],
            [ .99, 192, 192, 0, .5 ],
            [ 1.0, 255, 0, 0, .5 ],
            [ 2.0, 255, 0, 0, .5 ]
        ];

        var gi = 0; // last index of gradient where gradient[gi][0] <= i;
        var startRow = gradient[gi];
        var endRow = gradient[gi+1];

        for (var i = 0; i <= 1; i += 1/256) {
            if (endRow[0] <= i) {
                ++gi;
                startRow = endRow;
                endRow = gradient[gi];
            }

            var x = (i - startRow[0]) / (endRow[0] - startRow[0]);
            var x1 = 1 - x;
            var c = [];
            for (var j = 1; j < 4; ++j) {
                c.push(Math.round(x1 * startRow[j] + x * endRow[j]));
            }
            c.push(x1 * startRow[4] + x * endRow[4]);
            gradientSamples.push('rgba(' + c.join(',') + ')');
        }
    }

    $(document).ready(main);

})();

