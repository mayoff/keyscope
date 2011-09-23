

module.define('app', function (require, exports) {

    var format = require('framework/utilities').format;
    var observePath = require('framework/observe').observePath;
    var keyboards = require('keyboards');
    var keyController = require('keyController');
    var sniffer = require('sniffer');
    var cssTransition = require('framework/cssTransition');
    var keyboardToolTipNode$;

    var app = {
        model: null,
        keyControllers: {},
        fingerChartController: null,
        keyContainingMouse: null,
        keyboardToolTipKeyModel: null,

        init: function () {
            this.model = new (require('model').Model)();
            this.initLayoutSelectElement();
            this.initLabelSetSelectElement();
            observePath(this.model, 'layoutId', this.layoutIdDidChange, this);
            observePath(this.model, 'labelSetId', this.labelSetIdDidChange, this);
            require('framework/domBinder').bind(document.body, this);
            this.layoutIdDidChange();
            this.labelSetIdDidChange();
            sniffer.runWithCallback(this.onSnifferMessage, this);

            this.initKeyboardToolTip();
        },

        initLayoutSelectElement: function () {
            var html = '';
            keyboards.keyboardIds.forEach(function (id) {
                html += format('<option value="{id}">{name}</option>', {
                    id: id,
                    name: keyboards.humanNameForKeyboardId(id)
                });
            }, this);
            var id = this.model.keyboardId;
            $('#keyboardSelect').html(html).val(id);
        },

        initLabelSetSelectElement: function () {
            var html = '';
            keyboards.labelSetIds.forEach(function (id) {
                html += format('<option value="{id}">{name}</option>', {
                    id: id,
                    name: keyboards.humanNameForLabelSetId(id)
                });
            }, this);
            var id = app.model.labelSetId;
            $('#labelSetSelect').html(html).val(id);
        },

        layoutIdDidChange: function () {
            var layout = keyboards.keyboardForId(app.model.layoutId);
            if (!layout)
                return;
            if (this.fingerChartController)
                this.fingerChartController.destroy();
            this.fingerChartController = require('fingerChartController').make($('#fingers')[0]);
            var keyControllers = app.keyControllers;
            for (var name in keyControllers)
                keyControllers[name].destroy();
            app.keyControllers = keyControllers = {};
            var keyboard$ = $('#keyboard'), keyboardNode = keyboard$[0];
            keyboard$.width(layout.width + 'mm').height(layout.height + 'mm');
            layout.keys.forEach(function (keyDescription) {
                this.fingerChartController.addKey(keyDescription, this.model.keyForName(keyDescription.name));
                keyControllers[keyDescription.name] = keyController.make({
                    keyDescription: keyDescription,
                    app: this,
                    parentNode: keyboardNode
                });
            }, this);
            this.fingerChartController.render();
        },

        labelSetIdDidChange: function () {
            var labelSet = keyboards.labelSetForId(app.model.labelSetId);
            var keyControllers = this.keyControllers;
            for (var name in keyControllers) {
                keyControllers[name].setLabel((name in labelSet) ? labelSet[name] : name);
            }
        },

        initKeyboardToolTip: function () {
            keyboardToolTipNode$ = $('#keyboardToolTip');
            observePath(this, 'keyContainingMouse.model', this.keyContainingMouseDidChange, this);
        },

        keyContainingMouseDidChange: function () {
            console.log('keyContainingMouse', this.keyContainingMouse && this.keyContainingMouse.model && this.keyContainingMouse.model.name);
            var style = keyboardToolTipNode$[0].style;
            if (this.keyContainingMouse.model === null) {
                keyboardToolTipNode$.removeClass('keyboardToolTipVisible') .addClass('keyboardToolTipHidden');
            } else {
                this.keyboardToolTipKeyModel = this.keyContainingMouse.model;
                keyboardToolTipNode$.addClass('keyboardToolTipVisible') .removeClass('keyboardToolTipHidden');
                var point = [
                    this.keyContainingMouse.anchor[0] - 21,
                    this.keyContainingMouse.anchor[1] ];
                style.webkitTransform = style.MozTransform = style.transform = format('translate({0}px,{1}px)', point);
            }
        },

        onSnifferMessage: function (message) {
            var action = message.action;
            var key = this.model.keyForName(message.key);
            key.state = action;
        }

    };

    exports.main = function () { app.init(); };

});

$(document).ready(function() { module.require('app').main(); });

