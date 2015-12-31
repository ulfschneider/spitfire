var selection;
Meteor.select = {
    select: function (id) {
        if (!selection) {
            selection = [];
        }
        if (Meteor.util.isArray(id)) {
            for (var i = 0; i < id.length; i++) {
                Meteor.select.select(id[i]);
            }
        } else {
            if (id && !Meteor.select.isSelected(id)) {
                selection.push(id);
                $("#draggable" + id)
                    .addClass("selected");
            }
        }
    },
    toggleSelect: function (id) {
        if (Meteor.util.isArray(id)) {
            for (var i = 0; i < id.length; i++) {
                Meteor.select.toggleSelect(id[i]);
            }
        } else {
            if (!Meteor.select.isSelected(id)) {
                Meteor.select.select(id);
            } else {
                Meteor.select.unSelect(id);
            }
        }
    },
    unSelect: function (id) {
        if (selection && id) {
            var i;
            if (Meteor.util.isArray(id)) {
                for ( i = 0; i < id.length; i++) {
                    Meteor.select.unSelect(id[i]);
                }
            } else {
                for ( i = 0; i < selection.length; i++) {
                    if (selection[i] === id) {
                        selection.splice(i, 1);
                        $("#draggable" + id)
                            .removeClass("selected");
                        break;
                    }
                }
            }
        }
    },
    isSelected: function (id) {
        if (selection && id) {
            for(var i = 0; i < selection.length; i++) {
                if (selection[i] === id) {
                    return true;
                }
            }
        } else if (selection && selection.length > 0) {
            return true;
        }
        return false;
    },
    clearSelect: function () {
        $(".selected")
            .removeClass("selected");
        selection = null;
    },
    getSelectedIds: function () {
        return selection;
    },
    getSelectedUIObjects: function () {
        var uiObjects = [];
        if (selection) {
            for (var i = 0; i < selection.length; i++) {
                var result = $("#draggable" + selection[i]);
                if (result) {
                    uiObjects.push(result);
                }
            }
        }
        return uiObjects;
    },
    getSelectedObjects: function () {
        var drawingObjects = [];
        if (selection) {
            for (var i = 0; i < selection.length; i++) {
                var result = DrawingObjects.findOne({_id: selection[i]});
                if (result) {
                    drawingObjects.push(result);
                }
            }
        }
        return drawingObjects;
    }
};

