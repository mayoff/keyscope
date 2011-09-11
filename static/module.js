

/*
    Based on these things:
    http://moonbase.rydia.net/mental/blog/programming/javascript/sprockets-versus-commonjs-require-for-client-side-javascript.html
    http://wiki.commonjs.org/wiki/Modules/1.1
    http://wiki.commonjs.org/wiki/Modules/Wrappings

    Since I require the module to provide its own name as well as its factory, my module object has a `define` method taking those two parameters instead of a `declare` method taking only the factory.
*/

var module;

(function () {

    var modules = {};
    var factories = {};
    var baseId = ''; // for resolving relative ids

    function resolveId(id) {
        var parts = id.split('/');
        if (parts[0] !== '.' && parts[0] !== '..')
            return id;
        parts.unshift.apply(parts, baseId.split('/').slice(0, -1));
        parts.reverse();
        var absParts = [];
        while (parts.length > 0) {
            var part = parts.pop();
            switch (part) {
                case '..': absParts.pop(); break;
                case '':
                case '.': break;
                default: absParts.push(part); break;
            }
        }
        return absParts.join('/');
    }

    function require(id) {
        id = resolveId(id);
        if (modules.hasOwnProperty(id))
            return modules[id];
        if (!factories.hasOwnProperty(id))
            throw new ReferenceError('Unknown module ' + id);
        var exports = modules[id] = {};
        var factory = factories[id];
        delete factories[id];
        var saveId = baseId;
        baseId = id;
        try {
            factory(module.require, exports, {id: id});
        } catch (e) {
            delete modules[id];
            factories[id] = factory;
            throw e;
        } finally {
            baseId = saveId;
        }
        return exports;
    }

    module = {
        define: function (id, factory) {
            if (modules.hasOwnProperty(id))
                throw new ReferenceError('Module ' + id + ' already instantiated');
            if (factories.hasOwnProperty(id)) {
                var priorFactory = factories[id];
                factories[id] = function (require, exports, module) {
                    priorFactory(require, exports, module);
                    factory(require, exports, module);
                };
            } else {
                factories[id] = factory;
            }
        },

        require: require
    };

})();


