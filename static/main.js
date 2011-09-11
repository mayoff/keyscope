

(function () {

    var require = module.require;
    var u = require('utilities');
    var keys$ = {};

    var gradientSamples = [];
    var keyPressCounts = {};
    var keysPressed = [];

    function main() {
        initGradientSamples();
        initKeyboardView();
        initKeyPressCounts();
        $('#resetButton').click(resetKeyPressCounts);
        var sniffer = new EventSource('/events');
        sniffer['onmessage'] = onSnifferMessage;
    }

    function initKeyboardView() {
        var html = '';
        var keyboard = require('keyboards/apple').keyboard();
        keyboard.keys.forEach(function (key) {
            html += u.format('<div class="key keyup" id="key_{name}" style="left:{x}mm;top:{y}mm;width:{width}mm;height:{height}mm">{label}</div>\n', key);
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

    function countKeypress(key) {
        if (!keyPressCounts.hasOwnProperty(key)) {
            keysPressed.push(key);
            keyPressCounts[key] = 1;
        }
        else ++keyPressCounts[key];

        onKeyPressCountsUpdated();
    }

    function onKeyPressCountsUpdated() {
        keysPressed.sort(function (a, b) { return keyPressCounts[a] - keyPressCounts[b]; });
        while (keysPressed.length && keyPressCounts[keysPressed[0]] === 0) {
            keys$[keysPressed[0]][0].style.removeProperty('background-color');
            delete keyPressCounts[keysPressed[0]];
            keysPressed.shift();
        }
        var kl = Math.max(keysPressed.length - 1, 1);
        var gl = gradientSamples.length - 1;
        keysPressed.forEach(function (key, i) {
            var color = gradientSamples[Math.floor(gl * i / kl)];
            keys$[keysPressed[i]].css('background-color', color);
        });

        saveKeyPressCounts();
    }

    function initKeyPressCounts() {
        if (!localStorage.KeyScope_keyPressCounts)
            return;
        keyPressCounts = JSON.parse(localStorage.KeyScope_keyPressCounts);
        keysPressed = u.keys(keyPressCounts);
        onKeyPressCountsUpdated();
    }

    function resetKeyPressCounts() {
        keysPressed.forEach(function (key) { keyPressCounts[key] = 0; });
        onKeyPressCountsUpdated();
    }

    function saveKeyPressCounts() {
        localStorage.KeyScope_keyPressCounts = JSON.stringify(keyPressCounts);
    }

    function initGradientSamples() {
        var gradient = [
            // x   hue  sat  lit
            [ .00, 210, 100,  95 ],
            [ .20, 210, 100,  75 ],
            [ 1.0,   0, 100,  75 ],
            [ 2.0,   0, 100,  75 ]
        ]

        var gi = 0; // last index of gradient where gradient[gi][0] <= i;
        var startRow = gradient[gi];
        var endRow = gradient[gi+1];

        for (var i = 0; i <= 1; i += 1/128) {
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
            gradientSamples.push(u.format('hsl({0}, {1}%, {2}%)', c));
        }
    }

    $(document).ready(main);

})();

