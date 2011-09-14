

module.define('keyboards/maker', function (require, exports) {

    var labelSets = {}; // Fully initialized later.

    function KeyboardMaker(props) {
        props = props || {};
        this.scale = props.scale || 0.7;
        this.x = 0;
        this.y = 0;
        this._keys = [];
        this.labels = labelSets[props.labels || 'qwerty'].labels;
    };

    exports.KeyboardMaker = KeyboardMaker;

    KeyboardMaker.prototype.getKeyboard = function () {
        var w = -Infinity, h = -Infinity, scale = this.scale;
        this._keys.forEach(function (key) {
            key.x *= scale;
            key.y *= scale;
            key.width *= scale;
            key.height *= scale;
            w = Math.max(w, key.x + key.width);
            h = Math.max(h, key.y + key.height);
        });
        return {
            width: w,
            height: h,
            keys: this._keys
        };
    };

    var kRowPitch = 19;
    var kKeyWidth = 15;
    var kKeyHeight = 15;
    var kSeparation = 4;

    // Start a new row of keys `rowPitch` millimeters below the current row.
    KeyboardMaker.prototype.newRow = function (rowPitch) {
        this.x = 0;
        this.y += rowPitch || kRowPitch;
        return this;
    };

    // Move the origin of the next key to the right by `separation` millimeters, or the default separation if not given.
    KeyboardMaker.prototype.right = function (separation) {
        this.x += separation || kSeparation;
        return this;
    };

    // Define a key named `name`.  If given, `props` can override the width, height, label of the new key.  All sizes are in millimeters.
    KeyboardMaker.prototype.key = function (name, props) {
        props = props || {};
        var keyDefinition = {
            x: this.x,
            y: this.y,
            width: props.width || kKeyWidth,
            height: props.height || kKeyHeight,
            name: name,
            label: props.label || this.labels[name] || name
        };
        this._keys.push(keyDefinition);
        this.x += keyDefinition.width;
        return this;
    };

    // Define a new key named `name` with the default height and `width` as its width.
    KeyboardMaker.prototype.wideKey = function(name, width) {
        return this.key(name, { width: width });
    };

    // Define keys named `names`.  If `names` is a string, it will be split on spaces.  Otherwise it should be an array.  See the `keys` method for the meaning of `props`.  If `props` contains `separation`, I will separate each key horizontally by that many millimeters.  Otherwise I use a default separation.
    KeyboardMaker.prototype.keys = function (names, props) {
        if (names.split)
            names = names.split(' ');
        props = props || {};
        names.forEach(function (name, i) {
            if (i > 0)
                this.right(props.separation);
            this.key(name, props);
        }, this);
        return this;
    };

    // Move right skipping over space for `count` standard-width keys.
    KeyboardMaker.prototype.nokeys = function (count) {
        for (var i = 0; i < count; ++i) {
            if (i > 0)
                this.right();
            this.right(kKeyWidth);
        }
        return this;
    };

    function s(s) {
        return '<div class="keylabelSmaller">' + s + '</div>';
    }



    function ss(s) {
        return '<div class="keylabelSmallest">' + s + '</div>';
    }

    function f(s) {
        return '<div class="keylabelFKey">' + s + '</div>';
    }

    function escape(s) {
        return s === '<' ? '&lt;'
            : s === '>' ? '&gt;'
            : s === '&' ? '&amp;'
            : s;
    }

    function p(s) {
        return escape(s[0]) + '<br>' + escape(s[1]);
    }

    function ll(s) {
        return '<div class="keylabelLL">' + s + '</div>';
    }

    function lr(s) {
        return '<div class="keylabelLR">' + s + '</div>';
    }

    labelSets.qwerty = {
	humanName: 'QWERTY',
	labels: {
	    Escape: s('esc'),
	    Eject: '\u23cf',
	    Grave: p('~`'),
	    1: p('!1'),
	    2: p('@2'),
	    3: p('#3'),
	    4: p('$4'),
	    5: p('%5'),
	    6: p('^6'),
	    7: p('&7'),
	    8: p('*8'),
	    9: p('(9'),
	    0: p(')0'),
	    Minus: p('_-'),
	    Equal: p('+='),
	    Delete: lr('delete'),
	    Function: s('fn'),
	    Home: s('home'),
	    PageUp: s('page<br>up'),
	    KeypadClear: s('clear'),
	    KeypadEquals: '=',
	    KeypadDivide: '/',
	    KeypadMultiply: '*',
	    Tab: ll('tab'),
	    LeftBracket: p('{['),
	    RightBracket: p('}]'),
	    Backslash: p('|\\'),
	    ForwardDelete: ss('delete\u2326'),
	    End: s('end'),
	    PageDown: s('page<br>down'),
	    Keypad7: '7',
	    Keypad8: '8',
	    Keypad9: '9',
	    KeypadMinus: '-',
	    CapsLock: ll('caps lock'),
	    Semicolon: p(':;'),
	    Quote: p('"\''),
	    Return: lr('return'),
	    Keypad4: '4',
	    Keypad5: '5',
	    Keypad6: '6',
	    KeypadPlus: '+',
	    Shift: ll('shift'),
	    Comma: p('<,'),
	    Period: p('>.'),
	    Slash: p('?/'),
	    RightShift: lr('shift'),
	    UpArrow: s('\u25b2'),
	    Keypad1: '1',
	    Keypad2: '2',
	    Keypad3: '3',
	    KeypadEnter: lr('enter'),
	    Control: ll('control'),
	    Option: ll('option'),
	    Command: ll('command'),
	    Space: ' ',
	    RightCommand: lr('command'),
	    RightOption: lr('option'),
	    RightControl: lr('control'),
	    LeftArrow: s('\u25c0'),
	    DownArrow: s('\u25bc'),
	    RightArrow: s('\u25b6'),
	    Keypad0: '0',
	    KeypadDecimal: '.'
	}
    };

    for (var i = 1; i < 20; ++i) {
        labelSets.qwerty.labels['F'+i] = f('F'+i);
    }

    labelSets.dvorak = {
	humanName: 'Dvorak',
	labels: $.extend({}, labelSets.qwerty.labels, {
	    Q: p('"\''),
	    W: p('<,'),
	    E: p('>.'),
	    R: 'P',
	    T: 'Y',
	    Y: 'F',
	    U: 'G',
	    I: 'C',
	    O: 'R',
	    P: 'L',
	    LeftBracket: p('?/'),
	    RightBracket: p('+='),
	    A: 'A',
	    S: 'O',
	    D: 'E',
	    F: 'U',
	    G: 'I',
	    H: 'D',
	    J: 'H',
	    K: 'T',
	    L: 'N',
	    Semicolon: 'S',
	    Quote: p('_-'),
	    Z: p(':;'),
	    X: 'Q',
	    C: 'J',
	    V: 'K',
	    B: 'X',
	    N: 'B',
	    M: 'M',
	    Comma: 'W',
	    Period: 'Z'
	})
    };

    exports.labelSetIds = require('utilities').keys(labelSets);

    exports.humanNameForLabelSetId = function (id) {
	return labelSets[id].humanName;
    };

});

