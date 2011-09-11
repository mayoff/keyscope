

module.define('keyboards/_utilities', function (require, exports) {

    var labels = {}; // Fully initialized later.

    function KeyboardMaker() {
        this.x = 0;
        this.y = 0;
        this._keys = [];
        this.labels = labels.qwerty;
    };

    exports.KeyboardMaker = KeyboardMaker;

    KeyboardMaker.prototype.getKeyboard = function () {
        var w = -Infinity, h = -Infinity;
        this._keys.forEach(function (key) {
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

    labels.qwerty = {
        Escape: 'esc',
        Eject: '\u23cf',
        Grave: '`',
        Function: 'fn',
        PageUp: 'page<br>up',
        KeypadClear: 'clear',
        KeypadEquals: '=',
        KeypadDivide: '/',
        KeypadMultiply: '*',
        LeftBracket: '[',
        RightBracket: ']',
        Backslash: '\\',
        ForwardDelete: 'delete\u2326',
        PageDown: 'page<br>down',
        Keypad7: '7',
        Keypad8: '8',
        Keypad9: '9',
        KeypadMinus: '-',
        Semicolon: ';',
        Quote: "'",
        Keypad4: '4',
        Keypad5: '5',
        Keypad6: '6',
        KeypadPlus: '+',
        Comma: ',',
        Period: '.',
        Slash: '/',
        RightShift: 'shift',
        UpArrow: '\u25b2',
        Keypad1: '1',
        Keypad2: '2',
        Keypad3: '3',
        KeypadEnter: 'enter',
        Space: ' ',
        RightCommand: '\u2318 command',
        RightOption: 'option',
        RightControl: 'control',
        LeftArrow: '\u25c0',
        DownArrow: '\u25bc',
        RightArrow: '\u25b6',
        Keypad0: '0',
        KeypadDecimal: '.'
    };

    labels.dvorak = $.extend({}, labels.qwerty);

});

