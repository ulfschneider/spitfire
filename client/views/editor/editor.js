Meteor.editor = {

    isTopMarker: function () {
        return $(window).scrollTop() > 0;
    },
    isLeftMarker: function () {
        return $(window).scrollLeft() > 0;
    },
    isRightMarker: function () {
        var w = $(window);
        var e = $('#editor');
        var ww = w.width();
        var ew = e.width();
        var sl = $(w).scrollLeft();

        return sl + ww < ew;
    },
    isBottomMarker: function () {
        var w = $(window);
        var e = $('#editor');
        var wh = w.height();
        var eh = e.height();
        var st = $(w).scrollTop();

        return st + wh < eh;
    },
    maintainMarker: function () {
        $('#topMarker').css('display', Meteor.editor.isTopMarker() ? 'block' : 'none');
        $('#leftMarker').css('display', Meteor.editor.isLeftMarker() ? 'block' : 'none');
        $('#rightMarker').css('display', Meteor.editor.isRightMarker() ? 'block' : 'none');
        $('#bottomMarker').css('display', Meteor.editor.isBottomMarker() ? 'block' : 'none');

        var e = $('#editor');
        var w = $(window);
        e.width(Math.max(w.width(), Math.max(e.width(), Meteor.canvas.drawingWidth())));
        e.height(Math.max(w.height(), Math.max(e.height(), Meteor.canvas.drawingHeight())));
    },
    init: function () {
        $(window).on('scroll', function () {
            Meteor.editor.maintainMarker();
        });
        $(window).on('resize', function () {
            Meteor.editor.maintainMarker();
        });

        Template.editor.rendered = function () {
            Meteor.editor.maintainMarker();
        }
    }
}