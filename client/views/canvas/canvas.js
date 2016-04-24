var drawingWidth = 0;
var drawingHeight = 0;
var maxZIndex = 0;
var selectArea = null;

Meteor.canvas = {

    setOverlay: function (overlay, id) {
        if (overlay) {
            $("#overlay")
                .css("display", "block");
        } else {
            $("#overlay")
                .css("display", "none");
        }

        if (overlay && id) {
            $("#draggable" + id)
                .css("z-index", "2147483647");
            $("#sizeable" + id)
                .css("z-index", "2147483647");
            $("#textinput" + id)
                .css("z-index", "2147483647");
        } else if (!overlay && id) {
            $("#draggable" + id)
                .css("z-index", "");
            $("#sizeable" + id)
                .css("z-index", "");
            $("#textinput" + id)
                .css("z-index", "");
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
    _cleanUp: function (drawingObject) {
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
                Meteor.call("remove", drawingObject);
            } else {
                Meteor.call("cleanUp", cleanupData);
            }
        }
    },
    _maxSizeAndZIndex: function (drawingObject) {
        drawingWidth = Math.max(drawingWidth, drawingObject.left + drawingObject.width);
        drawingHeight = Math.max(drawingHeight, drawingObject.top + drawingObject.height);
        if (drawingObject.zIndex) {
            maxZIndex = Math.max(maxZIndex, drawingObject.zIndex);
        }
    },

    _getFilteredObjects: function () {
        if (Meteor.filter.getFilter()) {

            var query = [
                { //regular object
                    text: {
                        $regex: Meteor.filter.getRegExFilter(),
                        $options: "i"
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

        var filteredObjects = Meteor.canvas._getFilteredObjects();

        var editId = Meteor.text.editId();
        var initId = Meteor.text.initId();
        var sizeId = Meteor.drawingObject.getSizeId();
        var editOrInitFound = false;

        drawingWidth = 0;
        drawingHeight = 0;

       // if (editId ) {
       //     Meteor.canvas.setOverlay(true, editId);
       // }

        var prevObject; //TODO remove later

        filteredObjects.forEach(function (filteredObject) {

            //TODO remove later
            console.log(filteredObject._id);
            if (prevObject) {
                filteredObject.next =  prevObject;
            }
            prevObject = filteredObject._id;
            //TODO end remove

            if (!editOrInitFound) {
                if (initId && initId === filteredObject.initId) {
                    editOrInitFound = true;
                } else if (editId === filteredObject._id) {
                    editOrInitFound = true;
                }
            }
            Meteor.canvas._maxSizeAndZIndex(filteredObject);
            Meteor.canvas._cleanUp(filteredObject);


        });


        Meteor.editor.maintainBoundaryMarker();

        if (editId || initId) {
            if (!editOrInitFound) {
                //someone else removed a drawing-object while this user was editing
                Meteor.text.clearText();
           //     Meteor.canvas.setOverlay(false);
            }
       // } else {
       //     Meteor.canvas.setOverlay(false);
        }
        if (!selectArea) {
            Meteor.canvas._cleanUpSelectArea();
        }
        return filteredObjects;
    },
    _getLeft: function (sizeObject) {
        return sizeObject.width < 0 ? sizeObject.left + sizeObject.width : sizeObject.left;
    },
    _getTop: function (sizeObject) {
        return sizeObject.height < 0 ? sizeObject.top + sizeObject.height : sizeObject.top;
    },
    _getRight: function (sizeObject) {
        return Meteor.canvas._getLeft(sizeObject) + Math.abs(sizeObject.width);
    },
    _getBottom: function (sizeObject) {
        return Meteor.canvas._getTop(sizeObject) + Math.abs(sizeObject.height);
    },
    _touchedBySelectArea: function (id) {
        var screenObject = $("#draggable" + id);
        var sizeObject = {
            left: screenObject.position().left,
            top: screenObject.position().top,
            width: screenObject.width(),
            height: screenObject.height()
        };


        if ((Meteor.canvas._getLeft(sizeObject) >= Meteor.canvas._getLeft(selectArea) && Meteor.canvas._getLeft(sizeObject) <= Meteor.canvas._getRight(selectArea)) || (Meteor.canvas._getRight(sizeObject) >= Meteor.canvas._getLeft(selectArea) && Meteor.canvas._getRight(sizeObject) <= Meteor.canvas._getRight(selectArea))) {
            if ((Meteor.canvas._getTop(sizeObject) >= Meteor.canvas._getTop(selectArea) && Meteor.canvas._getTop(sizeObject) <= Meteor.canvas._getBottom(selectArea)) || (Meteor.canvas._getBottom(sizeObject) >= Meteor.canvas._getTop(selectArea) && Meteor.canvas._getBottom(sizeObject) <= Meteor.canvas._getBottom(selectArea))) {
                return true;
            }
        }
        if (Meteor.canvas._getLeft(sizeObject) < Meteor.canvas._getLeft(selectArea) && Meteor.canvas._getRight(sizeObject) > Meteor.canvas._getRight(selectArea)) {
            if ((Meteor.canvas._getTop(sizeObject) >= Meteor.canvas._getTop(selectArea) && Meteor.canvas._getTop(sizeObject) <= Meteor.canvas._getBottom(selectArea)) || (Meteor.canvas._getBottom(sizeObject) >= Meteor.canvas._getTop(selectArea) && Meteor.canvas._getBottom(sizeObject) <= Meteor.canvas._getBottom(selectArea))) {
                return true;
            }
        }
        if (Meteor.canvas._getTop(sizeObject) < Meteor.canvas._getTop(selectArea) && Meteor.canvas._getBottom(sizeObject) > Meteor.canvas._getBottom(selectArea)) {
            if ((Meteor.canvas._getLeft(sizeObject) >= Meteor.canvas._getLeft(selectArea) && Meteor.canvas._getLeft(sizeObject) <= Meteor.canvas._getRight(selectArea)) || (Meteor.canvas._getRight(sizeObject) >= Meteor.canvas._getLeft(selectArea) && Meteor.canvas._getRight(sizeObject) <= Meteor.canvas._getRight(selectArea))) {
                return true;
            }
        }
        return false;
    },
    _cleanUpSelectArea: function () {
        selectArea = null;
        $("#selectArea")
            .css({
                left: 0,
                top: 0,
                width: 0,
                height: 0,
                position: "absolute",
                display: "none"
            });
    },
    _selectAll: function () {
        var selectedObjects = [];

        Meteor.canvas.getDrawingObjects()
            .forEach(function (drawingObject) {
                selectedObjects.push(drawingObject);
            });

        Meteor.command.select(selectedObjects);

    },
    _selectByArea: function (event) {
        if (selectArea) {
            if (event.pageX != selectArea.left || event.pageY != selectArea.top) {

                selectArea.width = event.pageX - selectArea.left;
                selectArea.height = event.pageY - selectArea.top;

                $("#selectArea")
                    .css({
                        left: Meteor.canvas._getLeft(selectArea),
                        top: Meteor.canvas._getTop(selectArea),
                        width: Math.abs(selectArea.width),
                        height: Math.abs(selectArea.height),
                        position: "absolute",
                        display: "block"
                    });

                var selectedObjects = [];

                Meteor.canvas.getDrawingObjects()
                    .forEach(function (drawingObject) {
                        if (Meteor.canvas._touchedBySelectArea(drawingObject._id)) {
                            selectedObjects.push(drawingObject);
                        }
                    });

                Meteor.command.select(selectedObjects);
            }
        }
    },
    _extractFiles: function (event) {
        if (event.originalEvent) {
            if (event.originalEvent.dataTransfer) {
                return event.originalEvent.dataTransfer.files;
            }
        }
        return [];
    },
    _processFiles: function (files) {
        if (files && files.length > 0) {
            NProgress.start();
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                if (f.type.match("text.*")) {
                    Meteor.canvas._processFile(f);
                } else {
                    alert("The file " + f.name + " could not be imported into " + Meteor.spitfire.appTitle());
                }
            }
            NProgress.done();

        }
    },
    _processFile: function (file) {
        var reader = new FileReader();
        reader.onload = (function () {
            return function (event) {
                var lines = Meteor.canvas._getFileData(event.target.result);
                var height = Meteor.canvas.getDrawingHeight() + 4 * Meteor.text.getDefaultHeight();
                var left = Meteor.grid.getGridIndent();
                var width = Meteor.editor.getWidth();
                var objectsToInsert = [];
                for (var i = 0; i < lines.length; i++) {
                    objectsToInsert.push({
                        sessionName: Meteor.spitfire.getSessionName(),
                        text: lines[i],
                        top: height,
                        left: left,
                        width: Meteor.text.getDefaultWidth(),
                        height: Meteor.text.getDefaultHeight(),
                        zIndex: Meteor.canvas.getMaxZIndex() + 1
                    });
                    left = left + Meteor.text.getDefaultWidth() + Meteor.text.getDefaultHeight();
                    if (left > width) {
                        height = height + 4 * Meteor.text.getDefaultHeight();
                        left = Meteor.grid.getGridIndent();
                    }
                }
                Meteor.command.insert(objectsToInsert);

            }
        })(file);
        reader.readAsText(file);
    },
    _getFileData: function (data) {
        //create drawingObject from each line of text in data
        var trimmedLines = [];
        if (data) {
            var lines = data.split("\n");

            for (var i = 0; i < lines.length; i++) {
                var l = $.trim(Meteor.spitfire.replaceLineBreaks(lines[i], " "));
                if (l.length > 0) {
                    trimmedLines.push(l);
                }
            }
        }
        return trimmedLines;
    },
    _handleFileDrag: function (event) {
        if (event.originalEvent) {
            if (event.originalEvent.dataTransfer) {
                event.originalEvent.dataTransfer.dropEffect = "copy";
            }
        }
    }
};

(function () {
    $(document)
        .on("keyup", function(event) {
            if (event.which && event.which === 27 || event.keyCode && event.keyCode === 27) {
                Meteor.command.unSelect();
            }
        });
    $(document).on("keydown", function (event) {
            if (!Meteor.text.isEditing()) {
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
                        //cursor down
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
                        Meteor.canvas._selectAll();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                } else if ((event.which && (event.which === 8 || event.which === 46)) ||
                    (event.keyCode && (event.keyCode === 8 || event.keyCode === 46))) {
                    //backspace or delete
                    Meteor.drawingObject.remove();
                    event.preventDefault();
                    event.stopPropagation();
                } else if (event.which && event.which === 37 || event.keyCode && event.keyCode === 37) {
                    //cursor left
                    if (!event.ctrlKey && !event.metaKey) {
                        Meteor.drawingObject.moveLeft();
                        event.preventDefault();
                        event.stopPropagation();

                    }
                } else if (event.which && event.which === 38 || event.keyCode && event.keyCode === 38) {
                    //cursor top
                    if (!event.ctrlKey && !event.metaKey) {
                        Meteor.drawingObject.moveUp();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                } else if (event.which && event.which === 39 || event.keyCode && event.keyCode === 39) {
                    //cursor right
                    if (!event.ctrlKey && !event.metaKey) {
                        Meteor.drawingObject.moveRight();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                } else if (event.which && event.which === 40 || event.keyCode && event.keyCode === 40) {
                    //cursor down
                    if (!event.ctrlKey && !event.metaKey) {
                        Meteor.drawingObject.moveDown();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }
        });

    Template.canvas.helpers({
            drawingObjects: function () {
                return Meteor.canvas.getDrawingObjects();
            }
        }
    );


    Template.canvas.events({
        "click #canvas, dblclick #canvas": function (event) {
            Meteor.canvas._cleanUpSelectArea();
            if (Meteor.text.isEditing()) {
                Meteor.text.endEditing();
            } else {
                if (!event.ctrlKey && !event.metaKey && Meteor.select.isSelected()) {
                    Meteor.command.unSelect();
                } else if (Meteor.spitfire.hasSessionName()) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!event.ctrlKey && !event.metaKey) {
                        Meteor.text.initEditing(event);
                    }
                }
            }
        },
        "mousedown": function (event) {
            Meteor.canvas._cleanUpSelectArea();
            Meteor.text.endEditing();
            if (event.ctrlKey || event.metaKey) {
                selectArea = {left: event.pageX, top: event.pageY, width: 0, height: 0};
            }
        },
        "mousemove": function (event) {
            if (selectArea && (event.ctrlKey || event.metaKey)) {
                Meteor.canvas._selectByArea(event);
            }
        },
        "mouseup": function (event) {
            if (event.ctrlKey || event.metaKey) {
                Meteor.canvas._selectByArea(event);
            }
            Meteor.canvas._cleanUpSelectArea();
        },
        "dropped #canvas": function (event) {
            event.preventDefault();
            event.stopPropagation();
            Meteor.canvas._processFiles(Meteor.canvas._extractFiles(event));
        },
        "dragover #canvas": function (event) {
            event.preventDefault();
            event.stopPropagation();
            Meteor.canvas._handleFileDrag(event);
        }
    });


})();