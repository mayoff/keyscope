

/**

# Module domBinder

## Methods

*/

module.define('domBinder', function (require, exports) {

    var binders = {};
    var bind = require('bind');

    /**
    ### bind

        var root = ... // a DOM node
        var owner = ... // an object
        bind(root, owner)

    I connect DOM nodes to external objects based on `data-bind-*` attributes of the DOM nodes.

    #### Example of data-bind-event

    Suppose `root` refers to this DOM tree:

        <div>
            <button data-bind-event='resetAll'>Reset Everything</button>
            <input data-bind-event='inputWatcher.inputValueDidChange'>
            <select data-bind-event='selectedOptionDidChange'>
                <option value='a'>Option A</option>
                <option value='b'>Option B</option>
            </select>
        </div>

    Then you execute this:

        var owner = {
            resetAll: function (sender) { ... },
            inputWatcher: someObject,
            selectedOptionDidChange: function (sender) { ... }
        };
        bind(root, owner);

    When the user clicks the button, it will call `owner.resetAll(buttonNode)` (where `buttonNode` is the button's DOM node).  When the user changes the value in the input field, it will call `owner.inputWatcher.inputValueDidChange(inputNode)`.  When the user changes the select element's selected option, it will call `owner.selectedOptionDidChange(selectNode)`.

    #### Specification of data-bind-event

    I look for descendants of `root` that are BUTTON, SELECT, or INPUT elements with a `data-bind-event` attribute.  When I find one, I use the value of its `data-bind-event` attribute as a key path in `owner`.  I arrange for the method found at that key path to be a handler for the `click` (for BUTTON) or `change` (for SELECT or INPUT) event of the element.

    I traverse the key path each time an event is fired, so you can change the objects in the key path without needing to rebind the DOM.

    #### Specification of data-bind-value

    I look for descendants of `root` that have a `data-bind-value` attribute. xxx

    */

    exports.bind = function (root, owner) {
        for (var key in binders) {
            var binder = binders[key];
            var a = 'data-bind-' + key, selector = '[' + a + ']';
            if ($(root).is(selector))
                runBinder(binder, a, root, owner);
            var nodes = root.querySelectorAll(selector);
            Array.prototype.forEach.call(nodes, function (node) {
                runBinder(binder, a, node, owner);
            });
        }
    };

    function runBinder(binder, attribute, node, owner) {
        var value = node.getAttribute(attribute);
        if (value)
            binder(node, value, owner);
    }

    binders.event = function (node, path, owner) {
        var event;
        switch (node.tagName) {
            case 'INPUT': event = 'change'; break;
            case 'SELECT': event = 'change'; break;
            case 'BUTTON': event = 'click'; break;
            default:
                console.log('error: I don\'t know how to bind an event for a ' + node.tagName, node);
                return;
        }
        path = path.split('.');
        node['on' + event] = function () {
            var object = owner;
            for (var i = 0, l = path.length - 1; i < l; ++i) {
                object = object[path[i]];
            }
            object[path[i]](node);
        };
    };

    binders.value = function (node, path, owner) {
        switch (node.tagName) {
            case 'INPUT': break;
            case 'SELECT': break;
            default:
                console.log('error: I don\'t know how to bind the value af a ' + node.tagName);
        }

        bind.fromObjectPath(owner, path).toElementValue(node);
    };

    binders.innerhtml = function (node, path, owner) {
        bind.fromObjectPath(owner, path).toElementAttribute(node, 'innerHTML');
    };

});

