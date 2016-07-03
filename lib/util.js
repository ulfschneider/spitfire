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
    colorToRGB: function (color) {
        if (color) {
            var c = tinycolor(color);
            return c.toRgb();
        }
        return null;
    },
    colorToR: function(hex) {
        var rgb = Meteor.util.colorToRGB(hex);
        return rgb.r;
    },
    colorToG: function(hex) {
        var rgb = Meteor.util.colorToRGB(hex);
        return rgb.g;
    },
    colorToB: function(hex) {
        var rgb = Meteor.util.colorToRGB(hex);
        return rgb.b;
    },
    mixColor:function(color, opacity, background) {
        var colorRGB = Meteor.util.colorToRGB(color);
        var backgroundRGB = Meteor.util.colorToRGB(background);

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
    isLightColor: function(color) {
        return tinycolor(color).isLight();
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