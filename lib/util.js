Meteor.util = {
    clone: function (arg) {
        return JSON.parse(JSON.stringify(arg));
    },
    isArray: function (arg) {
        return arg && Object.prototype.toString.call(arg) === "[object Array]";
    },
    toArray: function (arg) {
        if (Meteor.util.isArray(arg)) {
            return arg;
        } else

            var ary = [];
        arg.forEach(function (a) {
            ary.push(a)
        });
        return ary;
    },
    isLightColor: function (r, g, b) {
        //referring to http://codepen.io/WebSeed/full/pvgqEq
        var a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return (a < 0.5);
    }
}
;