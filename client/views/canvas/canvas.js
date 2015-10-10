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
    getDrawingWidth: function () {
        return drawingWidth;
    },
    getDrawingHeight: function () {
        return drawingHeight;
    },
    getMaxZIndex: function () {
        return maxZIndex;
    },
    cleanUp: function (drawingObject) {
        var cleanup = false;
        var cleanupData = {_id: drawingObject._id};

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
            if (!drawingObject.text) {
                Meteor.call('remove', drawingObject);
            } else {
                Meteor.call('cleanUp', cleanupData);
            }
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
        if (Meteor.filter.getFilter()) {

            var query = [
                { //regular object
                    text: {
                        $regex: Meteor.filter.getRegExFilter(),
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
            ];
            var numberFilter = Meteor.filter.getNumberFilter();
            if (numberFilter > 0) {
                query.push({vote: numberFilter});
            }

            return DrawingObjects.find({
                    $or: query
                }
            );
        } else {
            return DrawingObjects.find();

        }
    },
    getDrawingObjects: function () {
        Meteor.grid.maintainGrid();

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


            filteredObjects.forEach(function (filteredObject) {

                if (!editOrInitFound) {
                    if (initId && initId === filteredObject.initId) {
                        editOrInitFound = true;
                    } else if (editId === filteredObject._id) {
                        editOrInitFound = true;
                    }
                }
                Meteor.canvas.maxSizeAndZIndex(filteredObject);
                Meteor.canvas.cleanUp(filteredObject);


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
    getLeft: function (sizeObject) {
        return sizeObject.width < 0 ? sizeObject.left + sizeObject.width : sizeObject.left;
    },
    getTop: function (sizeObject) {
        return sizeObject.height < 0 ? sizeObject.top + sizeObject.height : sizeObject.top;
    },
    getRight: function (sizeObject) {
        return Meteor.canvas.getLeft(sizeObject) + Math.abs(sizeObject.width);
    },
    getBottom: function (sizeObject) {
        return Meteor.canvas.getTop(sizeObject) + Math.abs(sizeObject.height);
    },
    touchedBySelectArea: function (id) {
        var screenObject = $('#draggable' + id);
        var sizeObject = {
            left: screenObject.position().left,
            top: screenObject.position().top,
            width: screenObject.width(),
            height: screenObject.height()
        };


        if ((Meteor.canvas.getLeft(sizeObject) >= Meteor.canvas.getLeft(selectArea) && Meteor.canvas.getLeft(sizeObject) <= Meteor.canvas.getRight(selectArea)) || (Meteor.canvas.getRight(sizeObject) >= Meteor.canvas.getLeft(selectArea) && Meteor.canvas.getRight(sizeObject) <= Meteor.canvas.getRight(selectArea))) {
            if ((Meteor.canvas.getTop(sizeObject) >= Meteor.canvas.getTop(selectArea) && Meteor.canvas.getTop(sizeObject) <= Meteor.canvas.getBottom(selectArea)) || (Meteor.canvas.getBottom(sizeObject) >= Meteor.canvas.getTop(selectArea) && Meteor.canvas.getBottom(sizeObject) <= Meteor.canvas.getBottom(selectArea))) {
                return true;
            }
        }
        if (Meteor.canvas.getLeft(sizeObject) < Meteor.canvas.getLeft(selectArea) && Meteor.canvas.getRight(sizeObject) > Meteor.canvas.getRight(selectArea)) {
            if ((Meteor.canvas.getTop(sizeObject) >= Meteor.canvas.getTop(selectArea) && Meteor.canvas.getTop(sizeObject) <= Meteor.canvas.getBottom(selectArea)) || (Meteor.canvas.getBottom(sizeObject) >= Meteor.canvas.getTop(selectArea) && Meteor.canvas.getBottom(sizeObject) <= Meteor.canvas.getBottom(selectArea))) {
                return true;
            }
        }
        if (Meteor.canvas.getTop(sizeObject) < Meteor.canvas.getTop(selectArea) && Meteor.canvas.getBottom(sizeObject) > Meteor.canvas.getBottom(selectArea)) {
            if ((Meteor.canvas.getLeft(sizeObject) >= Meteor.canvas.getLeft(selectArea) && Meteor.canvas.getLeft(sizeObject) <= Meteor.canvas.getRight(selectArea)) || (Meteor.canvas.getRight(sizeObject) >= Meteor.canvas.getLeft(selectArea) && Meteor.canvas.getRight(sizeObject) <= Meteor.canvas.getRight(selectArea))) {
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
    selectAll: function () {
        var selectedObjects = [];

        Meteor.canvas.getDrawingObjects().forEach(function (drawingObject) {
            selectedObjects.push(drawingObject);
        });

        Meteor.command.select(selectedObjects);

    },
    deselectAll:function() {
        Meteor.command.deSelect();
    },
    selectByArea: function (event) {
        if (selectArea) {
            if (event.pageX != selectArea.left || event.pageY != selectArea.top) {

                selectArea.width = event.pageX - selectArea.left;
                selectArea.height = event.pageY - selectArea.top;

                $('#selectArea').css({
                    left: Meteor.canvas.getLeft(selectArea),
                    top: Meteor.canvas.getTop(selectArea),
                    width: Math.abs(selectArea.width),
                    height: Math.abs(selectArea.height),
                    position: 'absolute',
                    display: 'block'
                });

                var selectedObjects = [];

                Meteor.canvas.getDrawingObjects().forEach(function (drawingObject) {
                    if (Meteor.canvas.touchedBySelectArea(drawingObject._id)) {
                        selectedObjects.push(drawingObject);
                    }
                });

                Meteor.command.select(selectedObjects);
            }
        }
    }
};

(function () {

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
        } else if (event.which && event.which === 65 || event.keyCode && event.keyCode === 65) {
            if (event.ctrlKey || event.metaKey) {
                Meteor.canvas.selectAll();
                event.preventDefault();
                event.stopPropagation();
            }
        }


    });

    //TODO have interval to call getDrawingObjects for clean up

    Template.canvas.helpers({
            drawingObjects: function () {
                return Meteor.canvas.getDrawingObjects();
            }
        }
    );


    Template.canvas.events({
        'click': function (event) {
            Meteor.canvas.cleanUpSelectArea();
            if (!event.ctrlKey && !event.metaKey) {
                Meteor.command.deSelect();
            }
            Meteor.text.endEditing();
        },
        'dblclick': function (event) {
            if (Meteor.spitfire.hasSessionName()) {
                event.preventDefault();
                event.stopPropagation();
                Meteor.text.endEditing();
                if (!event.ctrlKey && !event.metaKey) {
                    Meteor.text.initEditing(event);
                }
            }
        },
        'mousedown': function (event) {
            Meteor.canvas.cleanUpSelectArea();
            Meteor.text.endEditing();
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


})();