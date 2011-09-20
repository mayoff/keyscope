

module.define('observe', function (require, exports) {

    exports.observePath = function (subject, path, method, observer) {
        path = (path instanceof Array) ? path.slice(0) : path.split('.');
        observePathStartingAtIndex(subject, path, method, observer, 0);
    };

    exports.stopObservingPath = function (subject, path, method, observer) {
        pat = (path instanceof Array) ? path : path.split('.');
        stopObservingPathStartingAtIndex(subject, path, method, observer, 0);
    };

    function observePathStartingAtIndex(subject, path, method, observer, i) {
        for (var l = path.length; subject && i < l; ++i) {
            observePathComponent(subject, path, method, observer, i);
            subject = subject[path[i]];
        }
    }

    function stopObservingPathStartingAtIndex(subject, path, method, observer, i) {
        for (var l = path.length; subject && i < l; ++i) {
            stopObservingPathComponent(subject, path, method, observer, i);
            subject = subject[path[i]];
        }
    }

    function observePathComponent(subject, path, method, observer, pathIndex) {
        var key = path[pathIndex];
        var observers = observersForSubjectAndKey(subject, key);
        if (!observers)
            return;
        for (var i = observers.length; i--; ) {
            if (observers[i].method === method && observers[i].observers === observer)
                return;
        }
        observers.push({
            method: method,
            observer: observer,
            path: path,
            pathIndex: pathIndex
        });
    }

    function stopObservingPathComponent(subject, path, method, observer, pathIndex) {
        var key = path[pathIndex];
        var observers = existingObserversForSubjectAndKey(subject, key);
        if (!observers)
            return;
        for (var i = observers.length; i--; ) {
            if (observers[i].method === method && observers[i].observer === observer) {
                observers.splice(i, 1);
                break;
            }
        }
    }

    function existingObserversForSubjectAndKey(subject, key) {
        var desc = Object.getOwnPropertyDescriptor(subject, key);
        return desc && desc.set && desc.set.__observers;
    }

    var undefined, defaultDescriptor = {
        value: undefined,
        writable: true,
        enumerable: true,
        configurable: true
    };

    function observersForSubjectAndKey(subject, key) {
        var oldDesc = Object.getOwnPropertyDescriptor(subject, key) || defaultDescriptor;
        if (oldDesc.set && oldDesc.set.__observers)
            return oldDesc.set.__observers;
        if (isDataDescriptor(oldDesc)) {
            if (!oldDesc.writable)
                return false; // No need to observe read-only properties
            oldDesc = convertPropertyToAccessor(subject, key, oldDesc);
        } else {
            if (!oldDesc.set)
                return false; // No need to observe read-only properties
            if (!oldDesc.get) {
                var error = new Error('cannot observe write-only key ' + key);
                error.subject = subject;
                throw error;
            }
        }

        var __observers = [];
        var oldSet = oldDesc.set;
        var isNotifying = false;
        var desc = {
            enumerable: oldDesc.enumerable,
            configurable: true,
            get: oldDesc.get,
            set: function (newValue) {
                var oldValue = this[key];
                if (newValue === oldValue)
                    return newValue;
                if (isNotifying) {
                    var error = new Error('observed key ' + key + ' updated while notifying key\'s observers');
                    error.subject = subject;
                    throw error;
                }
                var os = __observers.slice(0);
                moveObservers(os, oldValue, newValue);
                oldSet.call(this, newValue);
                isNotifying = true;
                try {
                    for (var i = os.length; i--; )
                        notifyObserver(os[i], this);
                } finally {
                    isNotifying = false;
                }
                return newValue;
            }
        };
        desc.set.__observers = __observers;
        Object.defineProperty(subject, key, desc);
        return __observers;
    }

    function notifyObserver(o, changedObject) {
        var path = o.path, l = path.length, undefined;
        for (var i = o.pathIndex; i < l && changedObject !== null && changedObject !== undefined; ++i) {
            changedObject = changedObject[path[i]];
        }
        o.method.call(o.observer, changedObject);
    }

    function isDataDescriptor(desc) {
        return 'value' in desc || 'writable' in desc;
    }

    function convertPropertyToAccessor(subject, key, oldDesc) {
        var value = oldDesc.value;
        var desc = {
            enumerable: oldDesc.enumerable,
            configurable: true,
            get: function () { return value; },
            set: function (newValue) {
                value = newValue;
                return newValue;
            }
        };
        Object.defineProperty(subject, key, desc);
        return desc;
    }

    function moveObservers(observers, oldSubject, newSubject) {
        for (var i = observers.length; i--; ) {
            var o = observers[i];
            stopObservingPathStartingAtIndex(oldSubject, o.path, o.method, o.observer, o.pathIndex + 1);
            observePathStartingAtIndex(newSubject, o.path, o.method, o.observer, o.pathIndex + 1);
        }
    }

});

