

/**

# Module bind

## Introduction

I provide a way to keep pairs of values synchronized.  Each synchronized pair is called a *binding*.  Each value in the pair is called an *endpoint* of the binding.

Suppose you have an `INPUT` element with id `nameField`, and you want to synchronize its value with the value of `model.user.name`.

    var nameField = document.getElementById('#nameField');
    var binding = bind.fromElementValue(nameField).toObjectPath(model, 'user.name');

Here you've specified `nameField.value` as the from-end of the binding, and `model.user.name` as the to-end.

This has two effects.  First, I copy the from-end value (`nameField.value`) to the to-end.  This happens in an event handler that runs as soon as possible.

Second, I watch for either the from-end or the to-end to change.  When the from-end changes, I copy its new value to the to-end.  When the to-end changes, I copy its new value to the from-end.  These copies also happen in an event handler that runs as soon as possible after I notice the change.

So most of the time, it doesn't matter which is the from-end and which is the to-end.  I matters when the binding is first synchronized.  After that, usually only one endpoint changes at a time, so the changed endpoint gets copied to the other end.

However, it's possible for both endpoints to change before the as-soon-as-possible event handler runs.  In that case, the from-end wins again, and the to-end gets set to the from-end's value.

I'm clever enough to notice when an intermediate object in the key path changes.  Suppose you do this:

    model.user = { name: 'Fred' };

I'll notice that `model.user` changed.  I assume that `model.user.value` is now different (I don't check) and I synchronize `nameField.value` to it.

You can manually disconnect a binding by calling the binding's `destroy` method:

    binding.destroy();

It's safe to call `destroy` repeatedly.

But it's often not convenient to keep a reference to the binding around.  Instead, you can set `nameField.isDestroyed` to true.  The next time I think I need to synchronize the binding, I'll notice and disconnect the binding.  You can also set `model.isDestroyed` to true, or `model.user.isDestroyed`.  (However, I won't pay attention to `model.user.name.isDestroyed` or `nameField.value.isDestroyed`.)

## Methods

Each of my `from...` methods begins the creation of a new binding, returning a temporary object called a partial binding.  You must call one of the `to...` methods on the partial binding to finish creating the binding.

### fromObjectPath

> `bind.fromObjectPath(object, keyPath)` &rarr; `partialBinding`

I begin the creation of a new binding, using `object` with `keyPath` as the from-end of the binding.  The `keyPath` is a string, which I'll split into components separated by `.` characters.  To get or set the value of the endpoint, I start with `object`.  I use each component of the path as a key to move to the next object along the path.  The final component of the path determines the key whose value I get or set.

For example, if your `keyPath` is `user.address.country`, I'll get or set the value of `object['user']['address']['country']`.  I'll notice if you change `object['user']`, `object['user']['address']`, or `object['user']['address']['country']`.  Regardless of which one you change, I'll then copy `object['user']['address']['country']` to the binding's other endpoint.

If you set the `isDestroyed` property to true on any of the objects along the path, I'll disconnect the binding the next time it needs to be synchronized.  So in the example, I'll notice `object.isDestroyed`, `object.user.isDestroyed`, and `object.user.address.isDestroyed`.  I won't notice `object.user.address.country.isDestroyed`.

### fromElementValue

> `bind.fromElementValue(domElement)` &rarr; `partialBinding`

I begin the creation of a new binding, using `domElement.value` as the from-end of the binding. I can only detect changes to `domElement.value` by handling `change` events dispatched by `domElement`.  The browser sends a `change` event when the user changes an INPUT or SELECT element.  If you change `domElement.value` from JavaScript, you need to send the `change` event.  I provide two methods you can use to make sure this happens: `changeElementValue` and `sendChangeEvent`.

If you set the `isDestroyed` property to true on `domElement`, I'll disconnect the binding the next time it needs to be synchronized.

### fromLocalStorageKey

> `bind.fromLocalStorageKey(key)` &rarr; `partialBinding`

I begin the creation of a new binding, using `localStorage[key]` as the from-end of the binding.  I can't detect changes to `localStorage[key]`.  I'll copy its value to the to-end when the binding is first synchronized, but after that I won't copy new values from the from-end to the to-end.

### toObjectPath

> `partialBinding.toObjectPath(object, keyPath)` &rarr; `binding`

I finish creating a binding, using `object` with `keyPath` as the to-end of the binding.  See `fromObjectPath` for the details of object-path endpoints.

### toElementValue

> `partialBinding.toElementValue(domElement)` &rarr; `binding`

I finish creating a binding, using `domElement.value` as the to-end of the binding.  See `fromObjectPath` for the details of object-path endpoints.

### toLocalStorageKey

> `partialBinding.toLocalStorageKey(key)` &rarr; `binding`

I finish creating a binding, using `object` with `keyPath` as the to-end of the binding.  See `fromObjectPath` for the details of object-path endpoints.

### changeElementValue

> `changeElementValue(domElement, newValue)`

I set `domElement.value` to `newValue` and then ask `domElement` to dispatch a `change` event.  This ensures that I will synchronize any bindings that have `domElement.value` as an endpoint.

### sendChangeEvent

> `bind.sendChangeEvent(domElement)`

I create a `change` event and ask `domElement` to dispatch it.  This makes me synchronize any bindings that have `domElement.value` as an endpoint.

*/

module.define('bind', function (require, exports) {

    var ob = require('observe');
    var u = require('utilities');

    var kSyncEventData = '\03bc.sync';
    var scheduledBindings = [];

    function scheduleSync(binding) {
        scheduledBindings.push(binding);
        if (scheduledBindings.length === 1)
            window.postMessage(kSyncEventData, '*');
    }

    window.addEventListener('message', function bindSyncEventHandler(event) {
        if (event.data !== kSyncEventData || !scheduledBindings.length)
            return;
        var bindings = scheduledBindings;
        scheduledBindings = [];
        while (bindings.length)
            bindings.pop()._sync();
    });

    exports.fromObjectPath = function (object, path) {
        var binding = new Binding(new ObjectPathEndpoint(object, path));
    };

    exports.fromElementValue = function (element) {
        var binding = new Binding(new ElementValueEndpoint(element));
    };

    exports.fromLocalStorageKey = function (key) {
        var binding = new Binding(new LocalStorageKeyEndpoint(key));
    };

    exports.changeElementValue = function (element, newValue) {
        element.value = newValue;
        exports.sendChangeEvent(element);
    };

    exports.sendChangeEvent = function (element) {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('change', false, false);
        element.dispatchEvent(event);
    };

    function Binding(fromEnd) {
        this._fromEnd = fromEnd;
        this._toEnd = null;
        this._changedEnd = null;
    }

    // Called from my to... methods with the to-end.
    Binding.prototype._finishCreation = function (endpoint) {
        if (this._toEnd)
            this._throwError('binding already has to-end set');
        this._toEnd = endpoint;
        this._fromEnd.connect(this);
        this._toEnd.connect(this);
        this._endDidChange(this._fromEnd); // schedule first sync
    };

    Binding.prototype._throwError = function (message) {
        var error = new Error(message);
        error.binding = this;
        throw error;
    };

    // Called from the sync event handler.
    Binding.prototype._sync = function () {
        var changedEnd = this._changedEnd;
        if (!changedEnd)
            return;
        this._changedEnd = null;
        var newValue = changedEnd.value();
        if (changedEnd.targetIsDestroyed) {
            this.destroy();
            return;
        }
        var changingEnd = this._otherEnd(changedEnd);
        changingEnd.value(newValue);
        if (changingEnd.targetIsDestroyed) {
            this.destroy();
            return;
        }
    };

    // Called by my endpoints when they change.
    Binding.prototype._endDidChange = function (end) {
        if (!this._changedEnd)
            scheduleCallback(sync);
        if (this._changedEnd !== this._fromEnd)
            this._changedEnd = end;
    };

    Binding.prototype._otherEnd = function (end) {
        return end === this._fromEnd ? this._toEnd : this._fromEnd;
    };

    Binding.prototype.toObjectPath = function (object, path) {
        this._finishCreation(new ObjectPathEndpoint(object, path));
    };

    Binding.prototype.toElementValue = function (element) {
        this._finishCreation(new ElementValueEndpoint(element));
    };

    Binding.prototype.toLocalStorageKey = function (key) {
        this._finishCreation(new LocalStorageKeyEndpoint(key));
    };

    this.destroy = function () {
        this._fromEnd.destroy();
        this._toEnd.destroy();
    };

    function Endpoint() {
        this.binding = null;
        this.targetIsDestroyed = false;
    }

    Endpoint.prototype.connect = function (binding) {
        this.binding = binding;
        this.listenToTarget();
    };

    Endpoint.prototype.notifyBinding = function () {
        this.binding._endDidChange(this);
    };

    Endpoint.prototype.destroy = function () {
        this.stopListeningToTarget();
        this.isDestroyed = true;
    };

    function ObjectPathEndpoint(object, path) {
        Endpoint.call(this);
        this.object = object;
        this.path = (path instanceof Array) ? path.slice(0) : path.split('.');
    }

    ObjectPathEndpoint.prototype = u.create(Endpoint.prototype);

    ObjectPathEndpoint.prototype.listenToTarget = function () {
        ob.observePath(this.object, this.path, this.notifyBinding, this);
    };

    ObjectPathEndpoint.protoype.stopListeningToTarget = function () {
        ob.stopObservingPath(this.object, this.path, this.notifyBinding, this);
    };

    ObjectPathEndpoint.prototype.value = function (newValue) {
        var path = this.path, object = this.object, undefined;
        if (object.isDestroyed) {
            this.targetIsDestroyed = true;
            return undefined;
        }
        for (var i = 0, l = path.length - 1; i < l; ++i) {
            object = object[path[i]];
            if (object === undefined || object === null)
                return object;
            if (object.isDestroyed) {
                this.targetIsDestroyed = true;
                return undefined;
            }
        }
        return (arguments.length > 0) ? (object[path[i]] = newValue) : object[path[i]];
    };

    function ElementValueEndpoint(element) {
        Endpoint.call(this);
        this.element = element;
    }

    ElementValueEndpoint.prototype = u.create(Endpoint.prototype);

    ElementValueEndpoint.prototype.listenToTarget = function () {
        this.element.addEventListener('change', this, false);
    };

    ElementValueEndpoint.prototype.stopListeningToTarget = function () {
        this.element.removeEventListener('change', this, false);
    };

    ElementValueEndpoint.prototype.handleEvent = ElementValueEndpoint.prototype.notifyBinding;

    ElementValueEndpoint.prototype.value = function (newValue) {
        var element = this.element, undefined;
        if (element.isDestroyed) {
            this.targetIsDestroyed = true;
            return undefined;
        }
        return (arguments.length > 0) ? (element.value = newValue) : element.value;
    };

    ////////////////////////////////////////////////////////////////

    var newBindings = [];
    var dirtyBindings = [];
    var syncIsScheduled = false;

    window.addEventListener('message', function onSyncEvent(event) {
        if (event.data !== kSyncEventData)
            return;
        syncIsScheduled = false;

        if (newBindings.length) {
            var bs = newBindings;
            newBindings = [];
            while (bs.length)
                bs.pop()._syncNew();
        }

        if (dirtyBindings.length) {
            var bs = dirtyBindings;
            dirtyBindings = [];
            while (bs.length)
                bs.pop()._syncNow();
        }
    }, false);

    function scheduleSync() {
        if  (syncIsScheduled)
            return;
        window.postMessage(kSyncEventData, '*');
        syncIsScheduled = true;
    }

    function addNewBinding(binding) {
        newBindings.push(binding);
        scheduleSync();
    }

    function addDirtyBinding(binding) {
        if (binding._isDirty)
            return;
        binding._isDirty = true;
        dirtyBindings.push(binding);
        scheduleSync();
    }

    var Arm = {
        // binding - the binding to which I belong
        // id - set when I am added to a Binding
        isDirty: false,

        create: function (binding, props) {
            var arm = u.create(this, props, this.className);
            arm.binding = binding;
            if (typeof arm._init === 'function')
                arm._init();
            binding._addArm(arm);
        },

        destroy: function () {
            this.binding._removeArm(this.id);
            this._unbind();
        },

        _augmentDestroyMethod: function (object) {
            var arm = this, oldDestroy = object.oldDestroy;
            object.destroy = function augmentedDestroy() {
                arm.destroy();
                return (typeof oldDestroy === 'function') ? oldDestroy.call(this) : undefined;
            };
        },

        _subjectDidChange: function () {
            this.binding._armDidChange(this.id);
        }
    };

    var KeyPathArm = u.create(Arm, {

        className: 'KeyPathArm',

        // object - the object at  which the path starts
        // path - an array of keys

        _init: function () {
            ob.observePath(this.object, this.path, this._subjectDidChange, this);
            this._augmentDestroyMethod(this.object);
        },

        _unbind: function () {
            ob.stopObservingPath(this.object, this.path, this._subjectDidChange, this);
        },

        value: function () {
            var object = this.object, path = this.path;
            for (var i = 0, l = path.length; i < l; ++i) {
                object = object[path[i]];
                if (object === undefined)
                    break;
            }
            return object;
        },

        setValue: function (newValue) {
            var object = this.object, path = this.path;
            for (var i = 0, l = path.length - 1; i < l; ++i) {
                object = object[path[i]];
                if (object === undefined)
                    return;
            }
            object[path[i]] = newValue;
        }

    });

    var ElementValueArm = u.create(Arm, {

        className: 'ElementValueArm',

        // node - the HTML element; must fire 'change' when its value attribute changes

        _init: function () {
            this.node.addEventListener('change', this, false);
            this._augmentDestroyMethod(this.node);
        },

        _unbind: function () {
            this.node.removeEventListener('change', this, false);
        },

        value: function () {
            return this.node.value;
        },

        setValue: function (newValue) {
            if (this.node.value !== newValue)
                this.node.value = newValue;
        },

        handleEvent: Arm._subjectDidChange

    });

    var LocalStorageKeyArm = u.create(Arm, {

        className: 'LocalStorageKeyArm',

        // key - the localStorage key whose value I bind.  I don't detect changes to the value!

        _unbind: function () { },

        value: function () {
            return localStorage[this.key];
        },

        setValue: function (newValue) {
            localStorage[this.key] = newValue;
        }

    });

    exports.Binding = function () {
        this._isDirty = false;
        this.__isSyncing = false;
        this.__newValue = null;
        this.__arms = {};
        this.__nextArmId = 0;
        addNewBinding(this);
    };

    $.extend(exports.Binding.prototype, {

        destroy: function () {
            u.keys(this.__arms).forEach(function (arm) {
                arm.destroy();
            });
        },

        _addArm: function (arm) {
            var id = arm.id = this.__nextArmId++;
            this.__arms[id] = arm;
        },

        _removeArm: function (id) {
            delete this.__arms[id];
        },

        _armDidChange: function (id) {
            var arm = this.__arms[id];
            if (this.__isSyncing) {
                var armValue = arm.value();
                if (armValue === this.__newValue)
                    return;
                console.log('error: Binding saw yet another new value while already syncing new value', arm, armValue);
            }
            if (arm.isDirty)
                return;
            arm.isDirty = true;
            addDirtyBinding(this);
        },

        _syncNew: function () {
            if (this._isDirty)
                return; // will be handled by _syncNow momentarily
            for (var id in this.__arms) {
                var arm = this.__arms[id];
                if (arm.value() !== undefined) {
                    arm.isDirty = true;
                    this.__reallySync();
                    return;
                }
            }
        },

        _syncNow: function () {
            if (!this._isDirty)
                return;
            this._isDirty = false;
           this.__reallySync();
        },

        __reallySync: function () {
            this.__isSyncing = true;
            try {
                var dirtyArm = this.__findDirtyArm();
                if (!dirtyArm)
                    return;
                var newValue = this.__newValue = dirtyArm.value();
                var arms = this.__arms;
                for (var id in arms) {
                    var arm = arms[id];
                    arm.setValue(newValue);
                }
            } finally {
                this._isSyncing = false;
                this.__newValue = null;
            }
        },

        __findDirtyArm: function () {
            var arms = this.__arms, dirtyArm;
            for (var id in arms) {
                var arm = arms[id];
                if (!arm.isDirty)
                    continue;
                arm.isDirty = false;
                if (dirtyArm && dirtyArm.value() !== arm.value()) {
                    console.log('error: Binding saw more than one dirty arm', dirtyArm, arm);
                }
                dirtyArm = arm;
            }
            return dirtyArm;
        },

        bindObjectAndPath: function (object, path) {
            KeyPathArm.create(this, {
                object: object,
                path: path.split('.')
            });
            return this;
        },

        bindElementValue: function (node) {
            ElementValueArm.create(this, {
                node: node
            });
            return this;
        },

        bindLocalStorageKey: function (key) {
            LocalStorageKeyArm.create(this, {
                key: key
            });
            return this;
        }

    });

});

