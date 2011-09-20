

module.define('keyController', function (require, exports) {

    var format = require('framework/utilities').format;
    var domBinder = require('framework/domBinder');
    var observe = require('framework/observe');

    exports.make = function (args) {
        return new KeyController(args.keyDescription, args.app, args.parentNode);
    };

    function KeyController(keyDescription, app, parentNode) {
        this.name = keyDescription.name;
        this.label = this.name;
        this.key = app.model.keyForName(this.name);

        var node = this.node = document.createElement('div');
        this.node$ = $(node);
        node.className = 'key keyup';
        var style = node.style;
        style.left = keyDescription.x + 'mm';
        style.top = keyDescription.y + 'mm';
        style.width = keyDescription.width + 'mm';
        style.height = keyDescription.height + 'mm';
        node.innerHTML = format('<div class="keylabel" data-bind-innerhtml="label">{name}</div><div class="keyToolTip" data-bind-innerhtml="toolTipHtml"></div>', this);
        domBinder.bind(node, this);
        parentNode.appendChild(node);

        observe.observePath(this.key, 'state', this.keyStateDidChange, this, observe.kAugmentDestroyMethod);
        observe.observePath(this.key, 'pressCount', this.pressCountDidChange, this, observe.kAugmentDestroyMethod);
        this.pressCountDidChange();
    }

    KeyController.prototype.destroy = function () {
        this.node.parentNode.removeChild(this.node);
        this.node.isDestroyed = true;
        this.isDestroyed = true;
    };

    KeyController.prototype.keyStateDidChange = function (state) {
        this.node$.removeClass('keyup keydown').addClass('key' + state);
    };

    KeyController.prototype.pressCountDidChange = function (count) {
        this.toolTipHtml = format('Name: {name}<br>Times pressed: {pressCount}', this.key);
    };

    KeyController.prototype.onKeyDown = function () {
        $(this.node).removeClass('keyup').addClass('keydown');
    };

    KeyController.prototype.onKeyUp = function () {
        $(this.node).removeClass('keydown').addClass('keyup');
    };

});

