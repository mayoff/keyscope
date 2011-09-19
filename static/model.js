

module.define('model', function (require, exports) {

    var bind = require('bind');
    var ob = require('observe');

    var kLayoutIdKey = 'KeyScope_layoutId';
    var kLabelSetIdKey = 'KeyScope_labelSetId';

    var Model = exports.Model = function () {
        // Set observers first so initializing the properties will load the layout and labelSet.
        ob.observePath(this, 'layoutId', this.layoutIdDidChange, this);
        ob.observePath(this, 'labelSetId', this.labelSetIdDidChange, this);

        this.keys = {};
        this.layoutId = localStorage[kLayoutIdKey] || 'apple-us-with-keypad';
        this.labelSetId = localStorage[kLabelSetIdKey] || 'qwerty';

        bind.fromObjectPath(this, 'layoutId').toLocalStorageKey(kLayoutIdKey);
        bind.fromObjectPath(this, 'labelSetId').toLocalStorageKey(kLabelSetIdKey);
    };

    Model.prototype.layoutIdDidChange = function () {
        console.log('layoutId changed to ' + this.layoutId);
    };

    Model.prototype.labelSetIdDidChange = function () {
        console.log('labelSetId changed to ' + this.labelSetId);
    };

});

