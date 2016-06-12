var tinyColorPickOptions = {
    opacity: .6,
    colors: ['#ffffff', '#999999', '#000000',
        '#006600', '#66cc00', '#ccff99',
        '#990000', '#ff3300', '#ff9900',
        '#003399', '#0066cc', '#99ccff',
        '#999900', '#ffff00', '#ffff99'],
    colorsPerLine: 3
};

Meteor.tinyColorPick = {
    setColor: function(color) {
        if (color) {
            $("#tinycolorpick" + Template.currentData()._id)
                .css("background", color); //fallback in case opacity is not supported by browser
            if (tinyColorPickOptions.opacity) {
                var rgb = $.fn.hexToRGB(color);
                $("#tinycolorpick" + Template.currentData()._id)
                    .css("background", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + tinyColorPickOptions.opacity + ")");
            }
        }
    },

    setOptions: function(options) {
        tinyColorPickOptions.opacity = options.opacity;
        tinyColorPickOptions.colors = options.colors;
        tinyColorPickOptions.colorsPerLine = options.colorsPerLine;
    }
};

(function () {
    Template.tinyColorPick.events({
            "pick": function (event) {
            }
    });

    Template.tinyColorPick.helpers({});


    Template.tinyColorPick.rendered = function () {
        $("#tinycolorpick" + Template.currentData()._id)
            .simpleColorPicker(
                {   colorsPerLine: tinyColorPickOptions.colorsPerLine,
                    colors: tinyColorPickOptions.colors,
                    onChangeColor: function (color) {
                        var event = $.Event("pick", {"color" : color});
                        this.trigger(event);
                    }
                }
            );
    };

})();