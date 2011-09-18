

module.define('app', function (require, exports) {

    var format = require('utilities').format;
    var keyboards = require('keyboards');
    var keyboardView;

    var app = {
        model: null,
        resetKeyPressCounts: function () {
            console.log('resetKeyPressCounts');
        }
    };

    exports.main = function () {
        app.model = new (require('model').Model)();
	initKeyboardSelectElement();
	initLabelSetSelectElement();
	require('domBinder').bind(document.body, app);
	keyboardView = new (require('keyboardView').KeyboardView)(app.model);
    };

    function initKeyboardSelectElement() {
        var html = '';
        keyboards.keyboardIds.forEach(function (id) {
            html += format('<option value="{id}">{name}</option>', {
                id: id,
                name: keyboards.humanNameForKeyboardId(id)
            });
        });
        var id = app.model.keyboardId;
        $('#keyboardSelect').html(html).val(id);
    }

    function initLabelSetSelectElement() {
        var html = '';
        keyboards.labelSetIds.forEach(function (id) {
            html += format('<option value="{id}">{name}</option>', {
                id: id,
                name: keyboards.humanNameForLabelSetId(id)
            });
        });
        var id = app.model.labelSetId;
        $('#labelSetSelect').html(html).val(id);
    }

});

$(document).ready(function() { module.require('app').main(); });

