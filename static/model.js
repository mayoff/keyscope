

module.define('model', function (require, exports) {

    var bind = require('framework/bind');
    var observe = require('framework/observe');
    var u = require('framework/utilities');

    var kLayoutIdKey = 'KeyScope_layoutId';
    var kLabelSetIdKey = 'KeyScope_labelSetId';
    var kKeyPressCountKey = 'KeyScope_keyPressCounts';

    var Model = exports.Model = function () {
        this.keyPressCounts = JSON.parse(localStorage[kKeyPressCountKey] || '{}');

        this.keys = {};
        this.maxRank = 0;
        this.layoutId = localStorage[kLayoutIdKey] || 'apple-us-with-keypad';
        this.labelSetId = localStorage[kLabelSetIdKey] || 'qwerty';

        for (var name in this.keyPressCounts)
            this.keyForName(name);
        this.computeRanks();

        bind.fromObjectPath(this, 'layoutId').toLocalStorageKey(kLayoutIdKey);
        bind.fromObjectPath(this, 'labelSetId').toLocalStorageKey(kLabelSetIdKey);
    };

    Model.prototype.keyForName = function (name) {
        var keys = this.keys;
        var key = this.keys[name];
        if (!key) {
            this.keys[name] = key = {
                name: name,
                state: 'up',
                pressCount: this.keyPressCounts[name] || 0,
                rank: 0
            };
            observe.observePath(key, 'state', this.keyStateDidChange, this);
            observe.observePath(key, 'pressCount', this.keyPressCountDidChange, this);
        }
        return key;
    };

    Model.prototype.resetKeyPressCounts = function () {
        var keys = this.keys;
        for (var name in keys)
            keys[name].pressCount = 0;
        this.computeRanks();
    };

    Model.prototype.keyStateDidChange = function (_, o) {
        var key = o.subject;
        if (key.state === 'down') {
            ++key.pressCount;
            this.computeRanks();
        }
    };

    Model.prototype.keyPressCountDidChange = function (_, o) {
        var key = o.subject;
        this.keyPressCounts[key.name] = key.pressCount;
        this.saveKeyPressCounts();
    };

    Model.prototype.computeRanks = function () {
        var keys = this.keys, names = u.keys(keys);
        names.sort(function (a, b) {
            var d = keys[a].pressCount - keys[b].pressCount;
            return d ? d : a < b ? -1 : a > b ? 1 : 0;
        });
        var rank = 0;
        // Assign this.maxRank first in case keys[x].rank is observed.
        names.forEach(function (name) {
            if (keys[name].pressCount)
                ++rank;
        });
        this.maxRank = rank;
        rank = 0;
        names.forEach(function (name) {
            var key = keys[name];
            key.rank = key.pressCount ? ++rank : 0;
        }, this);
    };

    Model.prototype.saveKeyPressCounts = function () {
        localStorage[kKeyPressCountKey] = JSON.stringify(this.keyPressCounts);
    };

});

