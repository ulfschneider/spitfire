var selection;

Meteor.select = {
    select: function (id) {
        if (!selection) {
            selection = [];
        }
        if (id && !Meteor.select.isSelected(id)) {
            selection.push(id);
            $('#draggable' + id).addClass('selected');
        }
    },
    toggleSelect: function (id) {
        if (!Meteor.select.isSelected(id)) {
            Meteor.select.select(id);
        } else {
            Meteor.select.deSelect(id);
        }
    },
    deSelect: function (id) {
        if (selection && id) {
            for (var i in selection) if (selection[i] === id) {
                selection.splice(i, 1);
                $('#draggable' + id).removeClass('selected');
                break;
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
        $('.selected').removeClass('selected');
        selection = null;
    },
    getSelection: function () {
        return selection;
    },
    getSelectedObjects: function () {
        if (selection) {
            var drawingObjects = [];
            selection.forEach(function (id) {
                var result = DrawingObjects.findOne({_id: id});
                if (result) {
                    drawingObjects.push(result);
                }
            });
            return drawingObjects;
        }
    }
};