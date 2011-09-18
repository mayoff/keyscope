

module.define('model', function (require, exports) {

    var Binding = require('bind').Binding;

    exports.Model = function () {
        $.extend(this, {
            keys: {},
            layoutId: 'apple-us-with-keypad',
            labelSetId: 'qwerty'
        });

        new Binding().bindLocalStorageKey('KeyScope_layoutId') .bindObjectAndPath(this, 'layoutId');
        new Binding().bindLocalStorageKey('KeyScope_labelSetId') .bindObjectAndPath(this, 'labelSetId');
    };

});

