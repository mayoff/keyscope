

module.define('model', function (require, exports) {

    var bind = require('framework/bind');
    var observe = require('framework/observe');
    var u = require('framework/utilities');

    var kLayoutIdKey = 'KeyScope_layoutId';
    var kLabelSetIdKey = 'KeyScope_labelSetId';

    var Model = exports.Model = function () {
        this.keys = {};
        this.maxRank = 0;
        this.layoutId = localStorage[kLayoutIdKey] || 'apple-us-with-keypad';
        this.labelSetId = localStorage[kLabelSetIdKey] || 'qwerty';

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
                pressCount: 0,
                rank: 0
            };
            observe.observePath(key, 'state', this.keyStateDidChange, this);
        }
        return key;
    };

    Model.prototype.keyStateDidChange = function (_, o) {
        var key = o.subject;
        if (key.state === 'down') {
            ++key.pressCount;
            this.computeRanks();
        }
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

});

