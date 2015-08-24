var drawingWidth = 0;
var drawingHeight = 0;
var maxZIndex = 0;

Meteor.canvas = {

    setOverlay: function (overlay, id) {
        if (overlay) {
            $('#overlay').css('display', 'block');
        } else {
            $('#overlay').css('display', 'none');
            $('#overlay').attr('data-id', '');
        }

        if (overlay && id) {
            $('#draggable' + id).css('z-index', '2147483647');
            $('#sizeable' + id).css('z-index', '2147483647');
            $('#textinput' + id).css('z-index', '2147483647');
            $('#overlay').attr('data-id', id);
        } else if (!overlay && id) {
            $('#draggable' + id).css('z-index', '');
            $('#sizeable' + id).css('z-index', '');
            $('#textinput' + id).css('z-index', '');
        }

    },
    overlayAssignedId: function () {
        return $('#overlay').attr('data-id');
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
    cleanUp: function (data) {
        var cleanup = false;
        var cleanupData = {id : data._id};
        if (Meteor.drawingObject.isDragTimeout(data)) {
            cleanupData.dragging = null;
            cleanup = true;
        }
        if (Meteor.drawingObject.isSizeTimeout(data)) {
            cleanupData.sizing = null;
            cleanup = true;
            if (Meteor.drawingObject.sizeId() === data._id) {
                Meteor.drawingObject.clearSizing();
            }
        }
        if (Meteor.text.isInputTimeout(data)) {
            cleanupData.editing = null;
            cleanupData.initId = null;
            cleanup = true;
            if (Meteor.text.editId() === data._id) {
                Meteor.text.clearText();
            }
        }
        if (cleanup) {
            Meteor.call('cleanUp', cleanupData);
        }
    },

    init: function () {
        Template.canvas.helpers({

            drawingObjects: function () {
                var fetch = DrawingObjects.find().fetch(); //fetch all, because contents will possibly be manipulated
                var editId = Meteor.text.editId();
                var initId = Meteor.text.initId();
                var sizeId = Meteor.drawingObject.sizeId();
                var editOrInitFound = false;

                drawingWidth = 0;
                drawingHeight = 0;

                if (editId || sizeId) {
                    Meteor.canvas.setOverlay(true, editId ? editId : sizeId);
                }

                fetch.forEach(function (drawObject) {

                        if (!editOrInitFound) {
                            if (initId && initId === drawObject.initId) {
                                editOrInitFound = true;
                            } else if (editId === drawObject._id) {
                                editOrInitFound = true;
                            }
                        }

                        drawingWidth = Math.max(drawingWidth, drawObject.left + drawObject.width);
                        drawingHeight = Math.max(drawingHeight, drawObject.top + drawObject.height);
                        if (drawObject.zIndex) {
                            maxZIndex = Math.max(maxZIndex, drawObject.zIndex);
                        }

                        Meteor.canvas.cleanUp(drawObject);
                    }
                );
                Meteor.editor.maintainMarker();

                if (editId || initId) {
                    if (!editOrInitFound) {
                        //someone else removed a drawing-object while this user was editing
                        Meteor.text.clearText();
                        Meteor.canvas.setOverlay(false);
                    }
                } else if (!sizeId) {
                    Meteor.canvas.setOverlay(false);
                }

                return fetch;
            }
        });

        Template.canvas.events({
            'dblclick': function (event) {
                if (Meteor.spitfire.hasSessionName()) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.text.initEditing(event);
                }
            }

        });
    }

};
