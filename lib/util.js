Meteor.util = {
    clone: function (arg) {
        return JSON.parse(JSON.stringify(arg));
    },
    isArray: function (arg) {
        return arg && Object.prototype.toString.call(arg) === "[object Array]";
    },
    isUndefined: function(arg) {
        return typeof arg === "undefined";
    },
    isUndefinedOrNull: function(arg) {
        if (Meteor.util.isUndefined(arg)) {
            return true;
        }  else if (arg === null) {
            return true;
        } else {
            return false;
        }
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
    escapeRegEx: function (s) {
        return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },
    replaceLineBreaks: function (s, replacement) {
        return s.replace(/(\r\n|\n|\r)/gm, replacement);
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
    mixHexColor:function(color, opacity, background) {
        var colorRGB = Meteor.util.hexToRGB(color);
        var backgroundRGB = Meteor.util.hexToRGB(background);

        colorRGB.r = Math.floor(colorRGB.r * opacity);
        colorRGB.g = Math.floor(colorRGB.g * opacity);
        colorRGB.b = Math.floor(colorRGB.b * opacity);

        backgroundRGB.r = Math.floor(backgroundRGB.r * (1.0 - opacity));
        backgroundRGB.g = Math.floor(backgroundRGB.g * (1.0 - opacity));
        backgroundRGB.b = Math.floor(backgroundRGB.b * (1.0 - opacity));

        colorRGB.r += backgroundRGB.r;
        colorRGB.g += backgroundRGB.g;
        colorRGB.b += backgroundRGB.b;

        return "#" + colorRGB.r.toString(16) + colorRGB.g.toString(16) + colorRGB.b.toString(16);
    },
    isLightHexColor: function(hex) {
        var rgb = Meteor.util.hexToRGB(hex);
        return Meteor.util.isLightColor(rgb.r, rgb.g, rgb.b);
    },
    isLightColor: function (r, g, b) {
        //referring to http://codepen.io/WebSeed/full/pvgqEq
        var a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return (a < 0.5);
    },
    decorateId: function (id, decoration, type) {
        if (id) {
            var ix = id.indexOf("-" + (type ? type : ""));

            if (decoration) {
                if (ix < 0) {
                    return id + "-" + (type ? type : "") + decoration;
                } else {
                    return id.substring(0, ix) + "-" + (type ? type : "") + decoration;
                }
            }
        }
        return id;
    },
    uid: function () {
        return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(34)).slice(-4);
    }
}
;