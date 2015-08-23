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

                        if (Meteor.drawingObject.isDragTimeOut(drawObject)) {
                            drawObject.dragging = null;
                            //TODO remove dragging
                        }
                        if (Meteor.drawingObject.isSizeTimeOut(drawObject)) {
                            drawObject.sizing = null;
                            //TODO remove dragging - combine removals (dragging, sizing, editing)
                        }
                        if (Meteor.text.isInputTimeOut(drawObject)) {
                            drawObject.editing = null;
                            if (Meteor.text.editId() === drawObject._id) {
                                Meteor.text.clearText();
                                Meteor.text.removeEditing(drawObject._id);
                            }
                        }
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
