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
    hexToRGB: function (hex) {
        // expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    hexToR: function(hex) {
        var rgb = Meteor.util.hexToRGB(hex);
        return rgb.r;
    },
    hexToG: function(hex) {
        var rgb = Meteor.util.hexToRGB(hex);
        return rgb.g;
    },
    hexToB: function(hex) {
        var rgb = Meteor.util.hexToRGB(hex);
        return rgb.b;
    },
    isLightHexColor: function(hex) {
        var rgb = Meteor.util.hexToRGB(hex);
        return Meteor.util.isLightColor(rgb.r, rgb.g, rgb.b);
    },
    isLightColor: function (r, g, b) {
        //referring to http://codepen.io/WebSeed/full/pvgqEq
        var a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return (a < 0.5);
    }
}
;