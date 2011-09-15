

(function () {

    var require = module.require;
    var u = require('utilities');
    var keys$ = {};
    var labelSetSelect$;

    var gradientSamples = [];
    var keyPressCounts = {};
    var keysPressed = [];
    var fingerForKey = {};
    var keysForFinger = {};
    var fingerKeyNodeForKeyMap = {};

    function main() {
        initGradientSamples();
	initLabelSetSelect();
        initKeyboardView();
        initKeyPressCounts();
        $('#resetButton').click(resetKeyPressCounts);
        var sniffer = new EventSource('/events');
        sniffer['onmessage'] = onSnifferMessage;
    }

    function initLabelSetSelect() {
	labelSetSelect$ = $('#labelSetSelect');
	var km = require('keyboards/maker');
	var html = '';
	var selectedId = localStorage.KeyScope_labelSetId || 'qwerty';
	km.labelSetIds.forEach(function (id) {
	    html += u.format('<option value="{id}"{selected}>{name}</option>', {
		id: id,
		name: km.humanNameForLabelSetId(id),
		selected: id === selectedId ? ' selected' : ''
	    });
	});
	labelSetSelect$.html(html);
	labelSetSelect$.change(function () {
	    localStorage.KeyScope_labelSetId = labelSetSelect$.val();
	    initKeyboardView();
	    onKeyPressCountsUpdated();
	});
    }

    function initKeyboardView() {
        var html = '';
	var labelSetId = labelSetSelect$.val();
        var keyboard = require('keyboards/apple').keyboard({
	    labels: labelSetId
	});
	fingerForKey = keyboard.fingerForKey;
	keysForFinger = keyboard.keysForFinger;
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
	removeZeroCounts();
        saveKeyPressCounts();
	recolorKeyboard();
	redrawFingerCounts();
    }

    function removeZeroCounts() {
        keysPressed.sort(function (a, b) { return keyPressCounts[a] - keyPressCounts[b]; });
        while (keysPressed.length && keyPressCounts[keysPressed[0]] === 0) {
	    var key = keysPressed[0];
            keys$[key][0].style.removeProperty('background-color');
	    var fingerKeyNode = fingerKeyNodeForKey(key);
	    fingerKeyNode.parentNode.removeChild(fingerKeyNode);
            delete keyPressCounts[key];
            keysPressed.shift();
        }
    }

    function recolorKeyboard() {
        var kl = Math.max(keysPressed.length - 1, 1);
        var gl = gradientSamples.length - 1;
        keysPressed.forEach(function (key, i) {
            var color = gradientSamples[Math.floor(gl * i / kl)];
            keys$[keysPressed[i]].css('background-color', color);
        });
    }

    function redrawFingerCounts() {
	var fingerCounts = {};
	for (var key in keyPressCounts) {
	    var finger = fingerForKey[key];
	    if (!finger)
		continue;
	    fingerCounts[finger] = (fingerCounts[finger] || 0) + keyPressCounts[key];
	}
	var maxCount = Math.max.apply(Math, u.values(fingerCounts));
	u.keys(fingerCounts).forEach(function (finger) {
	    drawFingerKeys(finger, maxCount);
	});
    }

    function drawFingerKeys(finger, maxCount) {
	var fingerNode = $('#finger_' + finger)[0];
	if (!fingerNode)
	    return;
	var keys = keysForFinger[finger].filter(function (key) { return keyPressCounts[key] > 0; });
	keys.sort(function (a, b) { return keyPressCounts[b] - keyPressCounts[a]; });
	keys.forEach(function (key, i) {
	    var keyNode = fingerKeyNodeForKey(key);
	    if (fingerNode.children[i] !== keyNode)
		fingerNode.insertBefore(keyNode, fingerNode.children[i]);
	    keyNode.style.height = Math.max(1, 100 * keyPressCounts[key] / maxCount) + '%';
	});
    }

    function fingerKeyNodeForKey(key) {
	var node = fingerKeyNodeForKeyMap[key];
	if (!node) {
	    node = fingerKeyNodeForKeyMap[key] = document.createElement('div');
	    node.id = 'fingerKey_' + key;
	    node.className = 'fingerKey';
	    side = fingerForKey[key][0];
	    node.innerHTML = u.format('<div class="fingerKeyLabel">{key}</div><div class="fingerKeyToolTip{side}">{key}</div>', {key: key, side: side});
	}
	return node;
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

