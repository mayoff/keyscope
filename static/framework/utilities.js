

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

            format(aString, anObject) -> aFormattedString

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

});

