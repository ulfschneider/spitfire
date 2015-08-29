var drawingWidth = 0;
var drawingHeight = 0;
var maxZIndex = 0;

Meteor.canvas = {

    setOverlay: function (overlay, id) {
        if (overlay) {
            $('#overlay').css('display', 'block');
        } else {
            $('#overlay').css('display', 'none');
        }

        if (overlay && id) {
            $('#draggable' + id).css('z-index', '2147483647');
            $('#sizeable' + id).css('z-index', '2147483647');
            $('#textinput' + id).css('z-index', '2147483647');
        } else if (!overlay && id) {
            $('#draggable' + id).css('z-index', '');
            $('#sizeable' + id).css('z-index', '');
            $('#textinput' + id).css('z-index', '');
        }

    },
    drawingWidth: function () {
        return drawingWidth;
    },
    drawingHeight: function () {
        return drawingHeight;
    },
    maxZIndex: function () {
        return maxZIndex;
    },
    cleanUp: function (drawingObject) {
        var cleanup = false;
        var cleanupData = {id: drawingObject._id};
        if (Meteor.drawingObject.isDragTimeout(drawingObject)) {
            cleanupData.dragging = null;
            cleanup = true;
        }
        if (Meteor.drawingObject.isSizeTimeout(drawingObject)) {
            cleanupData.sizing = null;
            cleanup = true;
            if (Meteor.drawingObject.getSizeId() === drawingObject._id) {
                Meteor.drawingObject.clearSizing();
            }
        }
        if (Meteor.text.isInputTimeout(drawingObject)) {
            cleanupData.editing = null;
            cleanupData.initId = null;
            cleanup = true;
            if (Meteor.text.editId() === drawingObject._id) {
                Meteor.text.clearText();
            }
        }
        if (cleanup) {
            Meteor.call('cleanUp', cleanupData);
        }
    },
    maxSizeAndZIndex: function (drawingObject) {
        drawingWidth = Math.max(drawingWidth, drawingObject.left + drawingObject.width);
        drawingHeight = Math.max(drawingHeight, drawingObject.top + drawingObject.height);
        if (drawingObject.zIndex) {
            maxZIndex = Math.max(maxZIndex, drawingObject.zIndex);
        }
    },
    getFilteredObjects: function () {
        if (Meteor.spitfire.getFilter()) {
            return DrawingObjects.find({
                    $or: [
                        { //regular object
                            text: {
                                $regex: Meteor.spitfire.escapeRegEx(Meteor.spitfire.getFilter()),
                                $options: 'i'
                            }
                        },
                        { //currently edited object
                            _id: Meteor.text.editId()
                        },
                        { //new created object without editId
                            initId: {
                                $exists: true,
                                $ne: null
                            }
                        }
                    ]
                }
            ).fetch(); //fetch all, because contents will possibly be manipulated
        } else {
            return DrawingObjects.find().fetch(); //fetch all, because contents will possibly be manipulated

        }
    },

    init: function () {
        Template.canvas.helpers({

            drawingObjects: function () {

                var filteredObjects = Meteor.canvas.getFilteredObjects();

                var editId = Meteor.text.editId();
                var initId = Meteor.text.initId();
                var sizeId = Meteor.drawingObject.getSizeId();
                var editOrInitFound = false;

                drawingWidth = 0;
                drawingHeight = 0;

                if (editId || sizeId) {
                    Meteor.canvas.setOverlay(true, editId ? editId : sizeId);
                }


                filteredObjects.forEach(function (object) {

                    if (!editOrInitFound) {
                        if (initId && initId === object.initId) {
                            editOrInitFound = true;
                        } else if (editId === object._id) {
                            editOrInitFound = true;
                        }
                    }
                    Meteor.canvas.maxSizeAndZIndex(object);
                    Meteor.canvas.cleanUp(object);


                });

                Meteor.editor.maintainBoundaryMarker();

                if (editId || initId) {
                    if (!editOrInitFound) {
                        //someone else removed a drawing-object while this user was editing
                        Meteor.text.clearText();
                        Meteor.canvas.setOverlay(false);
                    }
                } else if (!sizeId) {
                    Meteor.canvas.setOverlay(false);
                }

                return filteredObjects;
            }
        });

        Template.canvas.events({
            'click #canvas': function (event) {
                Meteor.select.clearSelect();
            },
            'dblclick #canvas': function (event) {
                if (Meteor.spitfire.hasSessionName()) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.text.initEditing(event);
                }
            }

        });
    }

}
;
