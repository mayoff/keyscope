

module.define('app', function (require, exports) {

    var format = require('utilities').format;
    var observePath = require('observe').observePath;
    var keyboards = require('keyboards');
    var keyController = require('keyController');
    var sniffer = require('sniffer');

    var app = {
        model: null,
        keyControllers: {},

        resetKeyPressCounts: function () {
            console.log('resetKeyPressCounts');
        },

        init: function () {
            this.model = new (require('model').Model)();
            this.initLayoutSelectElement();
            this.initLabelSetSelectElement();
            observePath(this.model, 'layoutId', this.layoutIdDidChange, this);
            observePath(this.model, 'labelSetId', this.labelSetIdDidChange, this);
            require('domBinder').bind(document.body, this);
            this.layoutIdDidChange();
            this.labelSetIdDidChange();
            sniffer.runWithCallback(this.onSnifferMessage, this);
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
            }), this;
            var id = app.model.labelSetId;
            $('#labelSetSelect').html(html).val(id);
        },

        layoutIdDidChange: function () {
            var layout = keyboards.keyboardForId(app.model.layoutId);
            if (!layout)
                return;
            var keyControllers = app.keyControllers;
            for (var name in keyControllers)
                keyControllers[name].destroy();
            app.keyControllers = keyControllers = {};
            var keyboard$ = $('#keyboard'), keyboardNode = keyboard$[0];
            keyboard$.width(layout.width + 'mm').height(layout.height + 'mm');
            layout.keys.forEach(function (keyDescription) {
                keyControllers[keyDescription.name] = keyController.make({
                    keyDescription: keyDescription,
                    app: this,
                    parentNode: keyboardNode
                });
            }, this);
        },

        labelSetIdDidChange: function () {
            var labelSet = keyboards.labelSetForId(app.model.labelSetId);
            var keyControllers = this.keyControllers;
            for (var name in keyControllers) {
                if (name in keyControllers) {
                    keyControllers[name].label = (name in labelSet) ? labelSet[name] : name;
                }
            }
        },

        onSnifferMessage: function (message) {
            var action = message.action;
            var key = this.model.keyForName(message.key);
            key.state = action;
            if (action === 'down') {
                ++key.pressCount;
            }
        }

    };

    exports.main = function () { app.init(); };

});

$(document).ready(function() { module.require('app').main(); });

