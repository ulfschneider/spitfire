var selection;

Meteor.select = {
    select: function (id) {
        if (!selection) {
            selection = [];
        }
        if (Meteor.spitfire.isArray(id)) {
            for (var i = 0; i < id.length; i++) {
                Meteor.select.select(id[i]);
            }
        } else {
            if (id && !Meteor.select.isSelected(id)) {
                selection.push(id);
                $('#draggable' + id)
                    .addClass('selected');
            }
        }
    },
    toggleSelect: function (id) {
        if (Meteor.spitfire.isArray(id)) {
            for (var i = 0; i < id.length; i++) {
                Meteor.select.toggleSelect(id[i]);
            }
        } else {
            if (!Meteor.select.isSelected(id)) {
                Meteor.select.select(id);
            } else {
                Meteor.select.deSelect(id);
            }
        }
    },
    deSelect: function (id) {
        if (selection && id) {
            if (Meteor.spitfire.isArray(id)) {
                for (var i = 0; i < id.length; i++) {
                    Meteor.select.deSelect(id[i]);
                }
            } else {
                for (var i in selection) if (selection[i] === id) {
                    selection.splice(i, 1);
                    $('#draggable' + id)
                        .removeClass('selected');
                    break;
                }
            }
        }
    },
    isSelected: function (id) {
        if (selection && id) {
            for (var i in selection) if (selection[i] === id) {
                return true;
            }
        } else if (selection && selection.length > 0) {
            return true;
        }
        return false;
    },
    clearSelect: function () {
        $('.selected')
            .removeClass('selected');
        selection = null;
    },
    getSelectedIds: function () {
        return selection;
    },
    getSelectedUIObjects: function () {
        var uiObjects = [];
        if (selection) {
            selection.forEach(function (id) {
                var result = $('#draggable' + id);
                if (result) {
                    uiObjects.push(result);
                }
            });
        }
        return uiObjects;
    },
    getSelectedObjects: function () {
        var drawingObjects = [];
        if (selection) {
            selection.forEach(function (id) {
                var result = DrawingObjects.findOne({_id: id});
                if (result) {
                    drawingObjects.push(result);
                }
            });
        }
        return drawingObjects;
    }
};

