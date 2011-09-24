

module.define('framework/cssTransition', function (require, exports) {

    var dbstyle = document.body.style;
    exports.transitionEndEvent = false ? null
        : 'transition' in dbstyle ? 'transitionend'
        : 'webkitTransition' in dbstyle ? 'webkitTransitionEnd'
        : 'MozTransition' in dbstyle ? 'transitionend'
        : 'OTransition' in dbstyle ? 'oTransitionEnd'
        : null;

});

