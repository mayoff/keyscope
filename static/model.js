

module.define('model', function (require, exports) {

    var bind = require('bind');
    var ob = require('observe');

    var kLayoutIdKey = 'KeyScope_layoutId';
    var kLabelSetIdKey = 'KeyScope_labelSetId';

    var Model = exports.Model = function () {
        this.keys = {};
        this.layoutId = localStorage[kLayoutIdKey] || 'apple-us-with-keypad';
        this.labelSetId = localStorage[kLabelSetIdKey] || 'qwerty';

        bind.fromObjectPath(this, 'layoutId').toLocalStorageKey(kLayoutIdKey);
        bind.fromObjectPath(this, 'labelSetId').toLocalStorageKey(kLabelSetIdKey);
    };

    Model.prototype.keyForName = function (name) {
        if (name in this)
            return this[name];
        return this[name] = {
            name: name,
            state: 'up',
            pressCount: 0
        };
    };

});

