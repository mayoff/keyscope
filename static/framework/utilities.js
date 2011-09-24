

/**

# Module utilities

## Methods

*/

module.define('framework/utilities', function (require, exports) {

    /**
    ### keys

    This method performs the same function as the standard `Object.keys` method, in case your platform doesn't have the standard method.
    */

    exports.keys = Object.keys || function (object) {
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var keys = [];
        for (var k in object) {
            if (hasOwnProperty.call(object, k))
                keys.push(k);
        }
        return keys;
    };

    /**
    ### values

    > `utilities.values(object)` &rarr; `[value1, value2, ...]`

    I return a list containing the value of `object`'s enumerable properties.
    */
    exports.values = function (object) {
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var values = [];
	for (var k in object) {
	    if (hasOwnProperty.call(object, k))
		values.push(object[k]);
	}
	return values;
    };

    /**
    ### create

    > `utilities.create(prototype, props)` &rarr; `object`

    I create `object`, whose prototype is `prototype`.  I copy each enumerable property from `props` to `object`.
    */
    exports.create = function (prototype, props, name) {
        function AnonymousClass() { }
        if (name)
            AnonymousClass.displayName = name;
        AnonymousClass.prototype = prototype;
        return $.extend(new AnonymousClass(), props);
    };

    /**
    ### format

    > `format(aString, anObject)` &rarr; `aFormattedString`

    I replace placeholders in `aString` using properties of `anObject`.  I recognize these placeholders:<table>
    <tr><th>Placeholder</th><th>Replacement</th></tr>
    <tr><td>{{</td><td>{</td></tr>
    <tr><td>}}</td><td>}</td></tr>
    <tr><td>{key}</td><td>anObject[key]</td></tr>
    <tr><td>{key1.key2.key3...}</td><td>anObject[key1][key2][key3]...</td></tr>
    </table>

    A *key* is an identifier or a positive integer.  Examples:

        'Hello, {name}!'.format({name:'Delia'}) === 'Hello, Delia!'
        '({x},{y})'.format(new WebKitPoint(7, 10)) === '(7,10)'
        'Left brace={{ Right brace=}}'.format() === 'Left brace={ Right brace=}'
        '{1.2}'.format('abcde\nfghi\njklmn'.split(/\n/)) === 'h'
    */

    var re = /(\{\{)|(\}\})|(?:\{([0-9]+|[A-Za-z_$][A-Za-z_$0-9]*)\})|(?:\{((?:[0-9]+\.|[A-Za-z_$][A-Za-z_$0-9]*\.)+(?:[0-9]+|[A-Za-z_$][A-Za-z_$0-9]*))\})/g;


    function valueAtPathInObject(path, object) {
        for (var keys = path.split('.'), l = keys.length, i = 0; i < l && object !== null && object !== undefined; ++i) {
            object = object[keys[i]];
        }
        return object;
    }

    exports.format = function (format, object) {
        return format.replace(re, function (_, leftBrace, rightBrace, key, path) {
            return leftBrace ? '{' : rightBrace ? '}' : key ? object[key] : valueAtPathInObject(path, object);
        });
    };

    /**
    ### removePrefix

    > `removePrefix(string, prefix)` &rarr; `strippedString`

    If `string` starts with `prefix`, I return the substring of `string` with `prefix` removed.  Otherwise I just return `string`.
    */

    exports.removePrefix = function (s, p) {
        var pl = p.length;
        return (s.length >= pl && s.substr(0, pl) === p)
            ? s.substr(pl)
            : s;
    };

    /**
    ### forEachOwnProperty

    > `forEachOwnProperty(object, callback, thisObject)`

    I call `callback` as a method of `thisObject` once for each own-property of `object`.  I call `callback` like this:

        callback.call(thisObject, key, value, object);

    where `key` is a key of some own-property of `object` and `value` is the corresponding value.  The order in which keys are visited, and the effects of modifying `object`'s keys while I am running, are the same as those of the `for-in` statement.
    */

    exports.forEachOwnProperty = function (object, callback, thisObject) {
        var hop = Object.prototype.hasOwnProperty;
        for (var k in object) {
            if (hop.call(object, k))
                callback.call(thisObject, k, object[k], object);
        }
    };

    /**
    ### elementFromPoint

    > `elementFromPoint(clientX, clientY)` &rarr; `aDomElement`

    I wrap `document.elementFromPoint`, but I always take viewport coordinates even if the browser's implementation of `document.elementFromPoint` takes page coordinates.
    */

    exports.elementFromPoint = function (x, y) {
        // I'd like to figure out which coordinates I need to pass to document.elementfromPoint, but I can only do that if the document is scrolled.
        if (window.pageXOffset > 0 || window.pageYOffset > 0) {
            // Try to get the element using the page coordinate of the lower-right pixel of the window.  If it returns null, document.elementFromPoint wants viewport coordinates (clientX/clientY).
            var e = document.elementFromPoint(window.pageXOffset + window.innerWidth - 1, window.pageYOffset + window.innerHeight - 1);
            exports.elementFromPoint = (e === null)
                ? function (x, y) { return document.elementFromPoint(x, y) }
                : function (x, y) { return document.elementFromPoint(x + window.pageXOffset, y + window.pageYOffset); };
            return exports.elementFromPoint(x, y);
        } else {
            // Document isn't scrolled.  Page and viewport coordinates are the same.
            return document.elementFromPoint(x, y);
        }
    };

});

