

module.define('bind', function (require, exports) {

    var ob = require('observe');
    var u = require('utilities');

    var kSyncEventData = '\03bc.sync';
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

