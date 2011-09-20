

module.define('keyController', function (require, exports) {

    var format = require('framework/utilities').format;
    var domBinder = require('framework/domBinder');
    var observe = require('framework/observe');

    var gradient = [];

    (function makeGradient() {
        var gradientStops = [
            // x   hue  sat  lit
            [ .00, 210, 100,  97 ],
            [ .20, 210, 100,  86 ],
            [ 1.0,   0, 100,  75 ],
            [ 2.0,   0, 100,  75 ]
        ];

        function interpolate(a, b, x) { return Math.round((1 - x) * a + x * b); }

        gradient.push('white');

        var gi = 0, c = [ 0, 0, 0 ];
        // Note: 1/128 is an exact floating-point number.
        for (var i = 1/128; i <= 1; i += 1/128) {
            if (gradientStops[gi+1][0] <= i)
                ++gi;
            // gradientStop[gi][0] <= i < gradientStop[gi+1][0]
            var aStop = gradientStops[gi], bStop = gradientStops[gi+1];
            var x = (i - aStop[0]) / (bStop[0] - aStop[0]);
            for (var j = 1; j < 4; ++j)
                c[j-1] = interpolate(aStop[j], bStop[j], x);
            gradient.push(format('hsl({0},{1}%,{2}%)', c));
        }
    })();

    exports.make = function (args) {
        return new KeyController(args.keyDescription, args.app, args.parentNode);
    };

    function KeyController(keyDescription, app, parentNode) {
        this.name = keyDescription.name;
        this.label = this.name;
        this.model = app.model;
        this.key = app.model.keyForName(this.name);

        var node = this.node = document.createElement('div');
        this.node$ = $(node);
        node.className = 'key keyup';
        var style = node.style;
        style.left = keyDescription.x + 'mm';
        style.top = keyDescription.y + 'mm';
        style.width = keyDescription.width + 'mm';
        style.height = keyDescription.height + 'mm';
        node.innerHTML = format(
            '<div class="keylabel" data-bind-innerhtml="label">{name}</div>' +
            '<div class="keyToolTip">' +
                'Name: <span data-bind-innerhtml="name"></span><br>' +
                'Times pressed: <span data-bind-innerhtml="key.pressCount"></span><br>' +
                'Rank: <span data-bind-innerhtml="key.rank"></span>/<span data-bind-innerhtml="model.maxRank"></span>' +
            '</div>', this);
        domBinder.bind(node, this);
        parentNode.appendChild(node);

        observe.observePath(this.key, 'state', this.keyStateDidChange, this, observe.kAugmentDestroyMethod);
        observe.observePath(this.key, 'rank', this.rankDidChange, this, observe.kAugmentDestroyMethod);
        observe.observePath(app.model, 'maxRank', this.rankDidChange, this, observe.kAugmentDestroyMethod);
        this.rankDidChange();
    }

    KeyController.prototype.destroy = function () {
        this.node.parentNode.removeChild(this.node);
        this.node.isDestroyed = true;
        this.isDestroyed = true;
    };

    KeyController.prototype.keyStateDidChange = function (state) {
        this.node$.removeClass('keyup keydown').addClass('key' + state);
    };

    KeyController.prototype.rankDidChange = function () {
        var r = this.key.rank, mr = this.model.maxRank, l = gradient.length - 1;
        this.node.style.backgroundColor = gradient[Math.round(l * r / mr)];
    };

});

