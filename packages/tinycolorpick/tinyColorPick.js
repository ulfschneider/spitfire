var tinyColorPickOptions = {
    colorPickOpacity: .6,
    colors: ['#ffffff', '#999999', '#000000', '#66ff66', '#006600', '#ff9900', '#cc0000', '#99ccff', '#3399ff', '#000066', '#fafa33', '#fafad2'],
    colorsPerLine: 3
};

Meteor.tinyColorPick = {
    setColor: function(color) {
        if (color) {
            $("#tinycolorpick" + Template.currentData()._id)
                .css("background", color); //fallback in case opacity is not supported by browser
            if (tinyColorPickOptions.colorPickOpacity) {
                var rgb = $.fn.hexToRGB(color);
                $("#tinycolorpick" + Template.currentData()._id)
                    .css("background", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + tinyColorPickOptions.colorPickOpacity + ")");
            }
        }
    },

    setOptions: function(options) {
        tinyColorPickOptions.colorPickOpacity = options.colorPickOpacity;
        tinyColorPickOptions.colors = options.colors;
        tinyColorPickOptions.colorsPerLine = options.colorsPerLine;
    }
};

(function () {
    Template.tinyColorPick.events({
            "pick": function (event) {
            }
    }
    );

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