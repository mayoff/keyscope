

module.define('fingerChartController', function (require, exports) {

    var u = require('framework/utilities');
    var observe = require('framework/observe');

    exports.make = function (chartNode) {
        return new FingerChartController(chartNode);
    };

    function FingerChartController(chartNode) {
        this.node = chartNode;
        this.fingers = {};
        this.maxPressCount = -Infinity;
        var nodelist = this.node.querySelectorAll('.finger');
        Array.prototype.forEach.call(nodelist, function (fingerNode) {
            var fingerName = u.removePrefix(fingerNode.id, 'finger_');
            this.fingers[fingerName] = new FingerController(fingerName, fingerNode, this);
        }, this);
    }

    FingerChartController.prototype.destroy = function () {
        u.forEachOwnProperty(this.fingers, function (_, finger) { finger.destroy(); });
        this.isDestroyed = true;
    };

    FingerChartController.prototype.addKey = function (keyDescription, keyModel) {
        if (!keyDescription.finger)
            return;
        var finger = this.fingers[keyDescription.finger];
        if (!finger)
            return;
        finger.addKey(keyModel);
    };

    FingerChartController.prototype.render = function () {
        u.forEachOwnProperty(this.fingers, function (_, finger) {
            finger.keyPressCountDidChange();
        });
    };

    FingerChartController.prototype.fingerPressCountDidChange = function (finger) {
        var newMax = -Infinity;
        u.forEachOwnProperty(this.fingers, function (_, finger) {
            newMax = Math.max(newMax, finger.pressCount);
        }, this);
        this.maxPressCount = newMax;
    };

    function FingerController(name, node, chartController) {
        this.name = name;
        this.node = node;
        this.chartController = chartController;
        this.keys = [];
        this.pressCount = 0;
    }

    FingerController.prototype.destroy = function () {
        this.keys.forEach(function (key) { key.destroy(); }, this);
        this.isDestroyed = true;
    };

    FingerController.prototype.addKey = function (keyModel) {
        this.keys.push(new FingerKeyController(keyModel, this, this.chartController));
    };

    FingerController.prototype.keyPressCountDidChange = function () {
        var keys = this.keys;
        keys.sort(function (a, b) {
            return a.model.pressCount - b.model.pressCount;
        });
        var pc = 0, keyNodes = this.node.childNodes;
        this.keys.forEach(function (key, i) {
            pc += key.model.pressCount;
            if (keyNodes[i] !== key.node)
                this.node.insertBefore(key.node, keyNodes[i]);
        }, this);
        this.pressCount = pc;
        this.chartController.fingerPressCountDidChange(this);
    };

    function FingerKeyController(keyModel, fingerController, chartController) {
        this.model = keyModel;
        this.fingerController = fingerController;
        this.chartController = chartController;
        this.node = document.createElement('div');
        this.node.className = 'fingerKey';
        this.side = this.fingerController.name[0];
        this.node.innerHTML = u.format(
            '<div class="fingerKeyLabel">{model.name}</div>' +
            '<div class="fingerKeyToolTip{side}">{model.name}</div>', this);
        observe.observePath(keyModel, 'pressCount', this.pressCountDidChange, this, observe.kAugmentDestroyMethod);
        observe.observePath(this.chartController, 'maxPressCount', this.fixHeight, this, observe.kAugmentDestroyMethod);
    }

    FingerKeyController.prototype.destroy = function () {
        var p = this.node.parentNode;
        if (p) p.removeChild(this.node);
        this.node.isDestroyed = true;
        this.isDestroyed = true;
    };

    FingerKeyController.prototype.pressCountDidChange = function () {
        this.fingerController.keyPressCountDidChange();
        this.fixHeight();
    };

    FingerKeyController.prototype.fixHeight = function () {
        var pc = this.model.pressCount;
        if (pc === 0)
            this.node.style.display = 'none';
        else {
            this.node.style.display = 'block';
            this.node.style.height = Math.max(1, 100 * this.model.pressCount / this.chartController.maxPressCount) + '%';
        }
    };

});

