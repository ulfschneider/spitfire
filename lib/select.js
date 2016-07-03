var selection = null;
Meteor.select = {
    select: function (id) {
        if (!selection) {
            selection = [];
        }
        if (Meteor.util.isArray(id)) {
            _.each(id, function (i) {
                Meteor.select.select(i);
            });
        } else {
            if (id && !Meteor.select.isSelected(id)) {
                selection.push(id);
                $("#" + id)
                    .addClass("selected");
            }
        }
    },
    toggleSelect: function (id) {
        if (Meteor.util.isArray(id)) {
            _.each(id, function (i) {
                Meteor.select.toggleSelect(i);
            });
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
                _.each(id, function (i) {
                    Meteor.select.unSelect(i);
                });
            } else {
                for (i = 0; i < selection.length; i++) {
                    if (selection[i] === id) {
                        selection.splice(i, 1);
                        $("#" + id)
                            .removeClass("selected");
                        break;
                    }
                }
            }
        }
    },
    isSelected: function (id) {
        if (selection && id) {
            for (var i = 0; i < selection.length; i++) {
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
        _.each(selection, function (sel) {
            var result = $("#" + sel);
            if (result) {
                uiObjects.push(result);
            }
        });
        return uiObjects;
    },
    getSelectedObjects: function () {
        var drawingObjects = [];
        if (selection) {
            _.each(selection, function (sel) {
                var result = Meteor.spitfire.loadDrawingObject(sel);
                if (result) {
                    drawingObjects.push(result);
                }
            });
        }
        return drawingObjects;
    }
};

