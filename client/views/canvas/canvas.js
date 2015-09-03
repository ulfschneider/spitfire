var drawingWidth = 0;
var drawingHeight = 0;
var maxZIndex = 0;
var selectArea = null;

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

            console.log(Meteor.spitfire.getRegExFilter());
            return DrawingObjects.find({
                    $or: [
                        { //regular object
                            text: {
                                $regex: Meteor.spitfire.getRegExFilter(),
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
    getDrawingObjects: function () {

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
        } else if (!sizeId && !selectArea) {
            Meteor.canvas.setOverlay(false);
        }
        if (!selectArea) {
            Meteor.canvas.cleanUpSelectArea();
        }

        return filteredObjects;
    },
    left: function (sizeObject) {
        return sizeObject.width < 0 ? sizeObject.left + sizeObject.width : sizeObject.left;
    },
    top: function (sizeObject) {
        return sizeObject.height < 0 ? sizeObject.top + sizeObject.height : sizeObject.top;
    },
    right: function (sizeObject) {
        return Meteor.canvas.left(sizeObject) + Math.abs(sizeObject.width);
    },
    bottom: function (sizeObject) {
        return Meteor.canvas.top(sizeObject) + Math.abs(sizeObject.height);
    },
    touchedBySelectArea: function (id) {
        var screenObject = $('#draggable' + id);
        var sizeObject = {
            left: screenObject.position().left,
            top: screenObject.position().top,
            width: screenObject.width(),
            height: screenObject.height()
        };


        if ((Meteor.canvas.left(sizeObject) >= Meteor.canvas.left(selectArea) && Meteor.canvas.left(sizeObject) <= Meteor.canvas.right(selectArea)) || (Meteor.canvas.right(sizeObject) >= Meteor.canvas.left(selectArea) && Meteor.canvas.right(sizeObject) <= Meteor.canvas.right(selectArea))) {
            if ((Meteor.canvas.top(sizeObject) >= Meteor.canvas.top(selectArea) && Meteor.canvas.top(sizeObject) <= Meteor.canvas.bottom(selectArea)) || (Meteor.canvas.bottom(sizeObject) >= Meteor.canvas.top(selectArea) && Meteor.canvas.bottom(sizeObject) <= Meteor.canvas.bottom(selectArea))) {
                return true;
            }
        }
        if (Meteor.canvas.left(sizeObject) < Meteor.canvas.left(selectArea) && Meteor.canvas.right(sizeObject) > Meteor.canvas.right(selectArea)) {
            if ((Meteor.canvas.top(sizeObject) >= Meteor.canvas.top(selectArea) && Meteor.canvas.top(sizeObject) <= Meteor.canvas.bottom(selectArea)) || (Meteor.canvas.bottom(sizeObject) >= Meteor.canvas.top(selectArea) && Meteor.canvas.bottom(sizeObject) <= Meteor.canvas.bottom(selectArea))) {
                return true;
            }
        }
        if (Meteor.canvas.top(sizeObject) < Meteor.canvas.top(selectArea) && Meteor.canvas.bottom(sizeObject) > Meteor.canvas.bottom(selectArea)) {
            if ((Meteor.canvas.left(sizeObject) >= Meteor.canvas.left(selectArea) && Meteor.canvas.left(sizeObject) <= Meteor.canvas.right(selectArea)) || (Meteor.canvas.right(sizeObject) >= Meteor.canvas.left(selectArea) && Meteor.canvas.right(sizeObject) <= Meteor.canvas.right(selectArea))) {
                return true;
            }
        }
        return false;
    },
    cleanUpSelectArea: function () {
        selectArea = null;
        $('#selectArea').css({
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            position: 'absolute',
            display: 'none'
        });
    },
    selectByArea: function (event) {
        if (selectArea) {
            if (event.pageX != selectArea.left || event.pageY != selectArea.top) {

                selectArea.width = event.pageX - selectArea.left;
                selectArea.height = event.pageY - selectArea.top;

                $('#selectArea').css({
                    left: Meteor.canvas.left(selectArea),
                    top: Meteor.canvas.top(selectArea),
                    width: Math.abs(selectArea.width),
                    height: Math.abs(selectArea.height),
                    position: 'absolute',
                    display: 'block'
                });


                Meteor.canvas.getDrawingObjects().forEach(function (object) {
                    if (Meteor.canvas.touchedBySelectArea(object._id)) {
                        Meteor.select.select(object._id);
                    }
                });
            }
        }
    },

    init: function () {
        Template.canvas.helpers({
                drawingObjects: function () {
                    return Meteor.canvas.getDrawingObjects();
                }
            }
        );


        Template.canvas.events({
            'click #canvas': function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    Meteor.select.clearSelect();
                }
                if (Meteor.text.isEditing()) {
                    Meteor.text.submitText();
                } else {
                    Meteor.text.clearText();
                }
            },
            'dblclick #canvas': function (event) {
                if (Meteor.spitfire.hasSessionName()) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.text.initEditing(event);
                }
            },
            'mousedown #canvas': function (event) {
                if (event.ctrlKey || event.metaKey) {
                    selectArea = {left: event.pageX, top: event.pageY, width: 0, height: 0};
                }
            },
            'mousemove': function (event) {
                if (selectArea && (event.ctrlKey || event.metaKey)) {
                    Meteor.canvas.setOverlay(true);
                    Meteor.canvas.selectByArea(event);
                }
            },
            'mouseup': function (event) {
                if (event.ctrlKey || event.metaKey) {
                    Meteor.canvas.selectByArea(event);

                }

                Meteor.canvas.setOverlay(false);
                Meteor.canvas.cleanUpSelectArea();
            }
        });
    }
}
;
