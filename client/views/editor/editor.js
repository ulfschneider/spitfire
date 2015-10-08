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
    maintainBoundaryMarker: function () {
        $('#topMarker').css('display', Meteor.editor.isTopMarker() ? 'block' : 'none');
        $('#leftMarker').css('display', Meteor.editor.isLeftMarker() ? 'block' : 'none');
        $('#rightMarker').css('display', Meteor.editor.isRightMarker() ? 'block' : 'none');
        $('#bottomMarker').css('display', Meteor.editor.isBottomMarker() ? 'block' : 'none');

        var e = $('#editor');
        var w = $(window);
        e.width(Math.max(w.width(), Math.max(e.width(), Meteor.canvas.getDrawingWidth() + 200)));
        e.height(Math.max(w.height(), Math.max(e.height(), Meteor.canvas.getDrawingHeight() + 200)));
    },
    getWidth: function () {
        return $('#editor').width();
    },
    getHeight: function () {
        return $('#editor').height();
    }
};

(function () {
    $(window).on('scroll', function () {
        Meteor.editor.maintainBoundaryMarker();
    });
    $(window).on('resize', function () {
        Meteor.editor.maintainBoundaryMarker();
    });


    $(document).on('keydown', function (event) {
        if (Meteor.select.isSelected() && (event.ctrlKey || event.metaKey)) {

            if (event.which && event.which === 37 || event.keyCode && event.keyCode === 37) {
                //cursor left
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.alignLeft();
            } else if (event.which && event.which === 39 || event.keyCode && event.keyCode === 39) {
                //cursor right
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.alignRight();
            } else if (event.which && event.which === 38 || event.keyCode && event.keyCode === 38) {
                //cursor top
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.alignTop();
            } else if (event.which && event.which === 40 || event.keyCode && event.keyCode === 40) {
                //cursor bottom
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.alignBottom();
            }

        }

        if (event.which && event.which === 90 ||
            event.keyCode && event.keyCode === 90) {
            if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
                Meteor.command.undo();
                event.preventDefault();
                event.stopPropagation();
            } else if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                Meteor.command.redo();
                event.preventDefault();
                event.stopPropagation();
            }
        }

    });

    Template.editor.helpers({
        isAuth: function () {
            return Meteor.auth.isAuth();
        }
    });

    Template.editor.rendered = function () {
        document.title = Meteor.spitfire.documentTitle();
        Meteor.editor.maintainBoundaryMarker();
        Meteor.grid.maintainGrid();
    }
})();