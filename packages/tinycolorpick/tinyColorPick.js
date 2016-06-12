var tinyColorPickOptions = {
    opacity: .6,
    colors: ['#ffffff', '#f1453d', '#e62565', '#9b2fae', '#673fb4', '#4054b2', '#2b98f0', '#1eaaf1', '#1fbcd2', '#159588', '#50ae55', '#8cc152', '#cdda49', '#fee94e', '#fdc02f', '#fd9727', '#fc5830', '#785549', '#9e9e9e', '#617d88', '#fafad2'],
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