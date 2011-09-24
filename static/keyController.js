

module.define('keyController', function (require, exports) {

    var format = require('framework/utilities').format;
    var domBinder = require('framework/domBinder');
    var observe = require('framework/observe');

    // Gotta have 3D transforms to bother with a transition.
    var kTransitionDelayKey = false ? null
        : ('perspective' in document.body.style) ? 'transitionDelay'
        : ('webkitPerspective' in document.body.style) ? 'webkitTransitionDelay'
        : ('MozPerspective' in document.body.style) ? 'MozTransitionDelay'
        : false;

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
        var self = this;
        this.name = keyDescription.name;
        this.app = app;
        this.model = app.model;
        this.key = app.model.keyForName(this.name);
        this.sideShown = 'Front';

        var node = this.node = document.createElement('div');
        node.keyController = this;
        this.node$ = $(node);
        node.className = 'keyParent keyup';
        var style = node.style;
        style.left = keyDescription.x + 'mm';
        style.top = keyDescription.y + 'mm';
        style.width = keyDescription.width + 'mm';
        style.height = keyDescription.height + 'mm';
        node.innerHTML =
            '<div class="keylabel keylabelFront" data-bind-innerhtml="labelFront"></div>' +
            '<div class="keylabel keylabelBack" data-bind-innerhtml="labelBack"></div>';
        this.keylabelFront = node.querySelector('.keylabelFront');
        this.keylabelBack = node.querySelector('.keylabelBack');
        if (kTransitionDelayKey) {
            var transitionDelay = keyDescription.x + 'ms';
            this.keylabelFront.style[kTransitionDelayKey] = transitionDelay;
            this.keylabelBack.style[kTransitionDelayKey] = transitionDelay;
        } else {
            this['keylabel' + this.sideHidden].style.display = 'none';
        }
        domBinder.bind(node, this);
        parentNode.appendChild(node);

        var cr = node.getBoundingClientRect();
        this.toolTipAnchor = [ window.pageXOffset + Math.round(cr.left + cr.width/2), window.pageYOffset + cr.bottom ];

        this.node$.addClass('keylabelShow' + this.sideShown);

        observe.observePath(this.key, 'state', this.keyStateDidChange, this, observe.kAugmentDestroyMethod);
        observe.observePath(this.key, 'rank', this.rankDidChange, this, observe.kAugmentDestroyMethod);
        observe.observePath(app.model, 'maxRank', this.rankDidChange, this, observe.kAugmentDestroyMethod);
        this.rankDidChange();
    }

    Object.defineProperty(KeyController.prototype, 'sideHidden', {
        configurable: true,
        get: function () {
            return this.sideShown === 'Front' ? 'Back' : 'Front';
        }
    });

    KeyController.prototype.destroy = function () {
        this.node.parentNode.removeChild(this.node);
        this.node.isDestroyed = true;
        this.isDestroyed = true;
    };

    KeyController.prototype.mouseDidMoveInside = function () {
        var kcm = this.app.keyContainingMouse;
        if (kcm.model !== this.key) {
            kcm.anchor = this.toolTipAnchor;
            kcm.model = this.key;
        }
    };

    KeyController.prototype.setLabel = function (newLabel) {
        if (newLabel === this['label' + this.sideShown])
            return;
        if (!this['label' + this.sideShown] || !kTransitionDelayKey) {
            this['label' + this.sideShown] = newLabel;
            this['label' + this.sideHidden] = newLabel;
            return;
        }

        this['label' + this.sideHidden] = newLabel;
        this.node$.removeClass('keylabelShow' + this.sideShown) .addClass('keylabelShow' + this.sideHidden);
        this.sideShown = this.sideHidden;
        return; // xxx

        if (this.labelIsChanging) {
            if (this.nextLabel) this.nextLabel = newLabel;
            else this.label = newLabel;
            return;
        }

        this.nextLabel = newLabel;
        this.labelIsChanging = true;
        var self = this;

        function onTransitionEnd() {
            if (self.nextLabel) {
                self.name === 'Slash' && console.log('transition ending', self.labelNode.innerHTML);
                self.label = self.nextLabel;
                self.nextLabel = null;
                self.labelNode$.removeClass('labelChangeStarting') .addClass('labelChangeEnding');
            } else {
                self.name === 'Slash' && console.log('transition done', self.labelNode.innerHTML);
                self.labelNode.removeEventListener(kTransition.endEvent, onTransitionEnd, false);
                //self.labelNode$.removeClass('labelChangeEnding');
                self.labelIsChanging = false;
            }
        }

        this.name === 'Slash' && console.log('transition starting', this.labelNode.innerHTML);
        this.labelNode.addEventListener(kTransition.endEvent, onTransitionEnd, false);
        this.labelNode.style[kTransition.delay] = Math.floor(Math.random() * 250) + 'ms';
        this.labelNode$.removeClass('labelChangeEnding').addClass('labelChangeStarting');
    };

    KeyController.prototype.keyStateDidChange = function (state) {
        this.node$.removeClass('keyup keydown').addClass('key' + state);
    };

    KeyController.prototype.rankDidChange = function () {
        var r = this.key.rank, mr = this.model.maxRank, l = gradient.length - 1;
        var color = gradient[Math.round(l * r / Math.max(mr, 1))];
        this.keylabelFront.style.backgroundColor = color;
        this.keylabelBack.style.backgroundColor = color;
    };

});

