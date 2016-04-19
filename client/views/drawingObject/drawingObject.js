var dragTime;
var sizeId;
var DRAG_OR_SIZE_TIME_OUT = 1000 * 30; //milliseconds interval
var before;


Meteor.drawingObject = {
    isDragTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.dragging) {
            var now = new Date();
            return now.getTime() - drawingObject.dragging.getTime() > DRAG_OR_SIZE_TIME_OUT;
        }
        else {
            return false;
        }
    }
    ,
    isSizeTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.sizing) {
            var now = new Date();
            return now.getTime() - drawingObject.sizing.getTime() > DRAG_OR_SIZE_TIME_OUT;
        } else {
            return false;
        }
    }
    ,
    getSizeId: function () {
        return sizeId;
    }
    ,
    clearSizing: function () {
        sizeId = null;
    }
    ,
    enableDrag: function (id) {
        if (id) {
            $("#draggable" + id)
                .draggable({
                    scroll: true, helper: "original", containment: "#canvas", stack: ".draggable"
                });
        } else {
            $(".draggable")
                .draggable({
                    scroll: true, helper: "original", containment: "#canvas", stack: ".draggable"
                });
        }
    }
    ,
    enableResize: function (id) {
        if (id) {
            $("#sizeable" + id)
                .resizable({
                    minHeight: 22, minWidth: 22, autoHide: true, handles: "e, se"
                });
        } else {
            $(".sizeable")
                .resizable({
                    minHeight: 22, minWidth: 22, autoHide: true, handles: "e, se"
                });
        }
    }
    ,
    resize: function (drawingObject, zIndex, stop) {
        if (drawingObject) {
            var sizeable = $("#sizeable" + drawingObject._id);
            if (sizeable) {
                var width = sizeable.width();
                var height = sizeable.height();
                drawingObject.width = width;
                drawingObject.height = height;
                drawingObject.zIndex = zIndex;
                drawingObject.sizing = stop ? null : new Date();

                if (stop) {
                    var after = Meteor.util.clone(drawingObject);
                    Meteor.command.resize(before, after);
                } else {
                    Meteor.call("resize", drawingObject);
                }

            }
        }
    }
    ,
    _snapToGrid: function (drawingObject) {
        var draggable = $("#draggable" + drawingObject._id);
        if (draggable) {
            var position = draggable.position();
            if (position) {
                var l = Meteor.grid.snapLeft(position.left);
                var t = Meteor.grid.snapTop(position.top);
                draggable.css({left: l, top: t});
            }
        }
    }
    ,
    updatePosition: function (drawingObject, persist, zIndex, stop) {

        if (persist || stop) {
            Meteor.drawingObject._snapToGrid(drawingObject);
        }
        var position = $("#draggable" + drawingObject._id)
            .position();
        if (position) {

            if (Meteor.select.isSelected()) {
                //update the entire selection


                var xOffset = position.left - drawingObject.left;
                var yOffset = position.top - drawingObject.top;

                var selectedObjects = Meteor.select.getSelectedObjects();
                for (var i = 0; i < selectedObjects.length; i++) {
                    $("#draggable" + selectedObjects[i]._id)
                        .css({
                            left: selectedObjects[i].left + xOffset,
                            top: selectedObjects[i].top + yOffset
                        });

                    selectedObjects[i].left = selectedObjects[i].left + xOffset;
                    selectedObjects[i].top = selectedObjects[i].top + yOffset;
                    selectedObjects[i].zIndex = zIndex;
                    selectedObjects[i].dragging = stop ? null : new Date();
                }

                if (stop) {
                    Meteor.command.position(before, selectedObjects);
                } else if (persist) {
                    Meteor.call("updatePosition", selectedObjects);
                }


            } else {
                //update only one
                if (persist || stop) {
                    drawingObject.left = position.left;
                    drawingObject.top = position.top;
                    drawingObject.zIndex = zIndex;
                    drawingObject.dragging = stop ? null : new Date();
                    if (stop) {
                        var after = Meteor.util.clone(drawingObject);
                        Meteor.command.position(before, after);
                    } else {
                        Meteor.call("updatePosition", drawingObject);
                    }
                }
            }

            dragTime = new Date().getTime();
        }

    }
    ,
    _adaptPosition: function (drawingObject, left, top, zIndex) {
        drawingObject.left = left;
        drawingObject.top = top;
        drawingObject.zIndex = zIndex;
    }
    ,
    remove: function (drawingObject) {
        if (drawingObject) {
            Meteor.command.remove(drawingObject);
        } else {
            var selectedObjects = Meteor.select.getSelectedObjects();
            var before = Meteor.util.clone(selectedObjects);
            if (selectedObjects) {
                Meteor.command.remove(before);
            }
        }
    }
    ,
    vote: function (drawingObject) {
        Meteor.command.vote(drawingObject);
    }
    ,
    downVote: function (drawingObject) {
        Meteor.command.downVote(drawingObject);
    }
    ,
    alignLeft: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = Meteor.util.clone(selectedObjects);
        var minX = Meteor.canvas.getDrawingWidth();
        var i;

        for (i = 0; i < selectedObjects.length; i++) {
            minX = Math.min(selectedObjects[i].left, minX);
        }
        for (i = 0; i < selectedObjects.length; i++) {
            Meteor.drawingObject._adaptPosition(selectedObjects[i], minX, selectedObjects[i].top);
        }

        Meteor.command.position(before, selectedObjects);
    }
    ,
    alignRight: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = Meteor.util.clone(selectedObjects);
        var maxX = 0;
        var i;

        for (i = 0; i < selectedObjects.length; i++) {
            maxX = Math.max(selectedObjects[i].left + selectedObjects[i].width, maxX);
        }
        for (i = 0; i < selectedObjects.length; i++) {
            Meteor.drawingObject._adaptPosition(selectedObjects[i], maxX - selectedObjects[i].width, selectedObjects[i].top);
        }

        Meteor.command.position(before, selectedObjects);

    }
    ,
    alignTop: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = Meteor.util.clone(selectedObjects);
        var minY = Meteor.canvas.getDrawingHeight();
        var i;

        for (i = 0; i < selectedObjects.length; i++) {
            minY = Math.min(selectedObjects[i].top, minY);
        }
        for (i = 0; i < selectedObjects.length; i++) {
            Meteor.drawingObject._adaptPosition(selectedObjects[i], selectedObjects[i].left, minY);
        }

        Meteor.command.position(before, selectedObjects);

    }
    ,
    alignBottom: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = Meteor.util.clone(selectedObjects);
        var maxY = 0;
        var i, uiObject;

        for (i = 0; i < selectedObjects.length; i++) {
            uiObject = $("#draggable" + selectedObjects[i]._id);
            maxY = Math.max(selectedObjects[i].top + uiObject.height(), maxY);
        }
        for (i = 0; i < selectedObjects.length; i++) {
            uiObject = $("#draggable" + selectedObjects[i]._id);
            Meteor.drawingObject._adaptPosition(selectedObjects[i], selectedObjects[i].left, maxY - uiObject.height());
        }

        Meteor.command.position(before, selectedObjects);

    }
    ,
    moveLeft: function () {
        Meteor.drawingObject.move(-2, 0);
    }
    ,
    moveUp: function () {
        Meteor.drawingObject.move(0, -2);
    }
    ,
    moveRight: function () {
        Meteor.drawingObject.move(2, 0);
    }
    ,
    moveDown: function () {
        Meteor.drawingObject.move(0, 2);
    },
    move: function (left, top) {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = Meteor.util.clone(selectedObjects);
        var stop = false;
        var i;

        if (left < 0 || top < 0) {
            for (i = 0; i < selectedObjects.length; i++) {
                if (left < 0 && selectedObjects[i].left + left <= 0) {
                    stop = true;
                } else if (top < 0 && selectedObjects[i].top + top <= 0) {
                    stop = true;
                }
            }
        }
        if (!stop) {
            for (i = 0; i < selectedObjects.length; i++) {
                Meteor.drawingObject._adaptPosition(selectedObjects[i], selectedObjects[i].left + left, selectedObjects[i].top + top);
            }

            Meteor.command.position(before, selectedObjects);
        }
    }

};

(function () {

    Template.drawingObject.events({
            "click .text, dblclick .text": function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                    Meteor.text.editText(this);
                }
            },
            "dragstart": function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    if (!Meteor.select.isSelected(this._id)) {
                        Meteor.command.unSelect();
                    }
                    if (Meteor.select.isSelected()) {
                        before = Meteor.select.getSelectedObjects();
                    } else {
                        before = Meteor.util.clone(this);
                    }
                    Meteor.drawingObject.updatePosition(this, true, Meteor.canvas.getMaxZIndex() + 1);
                }
            },
            "drag": function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    var editor = $("#editor");
                    if (event.pageX + this.width > editor.width()) {
                        editor.width(editor.width() + 100);
                    }
                    if (event.pageY + this.height > editor.height()) {
                        editor.height(editor.height() + 100);
                    }
                    Meteor.drawingObject.updatePosition(this, false); //intentionally not changing z-index and not persisting
                }
            },
            "dragstop": function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    Meteor.drawingObject._snapToGrid(this);
                    Meteor.drawingObject.updatePosition(this, true, Meteor.canvas.getMaxZIndex() + 1, true);
                }
            },
            "resizestart": function () {
                sizeId = this._id;
                Meteor.command.unSelect();
                before = Meteor.util.clone(this);
                Meteor.drawingObject.resize(this, Meteor.canvas.getMaxZIndex() + 1);
                Meteor.canvas.setOverlay(true, this._id);
            },
            "resize": function () {
                Meteor.canvas.setOverlay(true, this._id);
            },
            "resizestop": function () {
                sizeId = null;
                Meteor.canvas.setOverlay(false, this._id);
                Meteor.drawingObject.resize(this, Meteor.canvas.getMaxZIndex() + 1, true);
            },

            "click .vote, dblclick .vote": function (event) {
                event.preventDefault();
                event.stopPropagation();

                Meteor.drawingObject.vote(this);
            },
            "click .down-vote, dblclick .down-vote": function (event) {
                event.preventDefault();
                event.stopPropagation();

                Meteor.drawingObject.downVote(this);
            },
            "click .sizeable": function (event) {
                if (event.metaKey || event.ctrlKey) {
                    if (Meteor.select.isSelected(this._id)) {
                        Meteor.command.unSelect(this);
                    } else {
                        Meteor.command.select(this);
                    }
                }
            },


            //must be last one, to not produce error: "must be attached ..."
            "click .delete, dblclick .delete": function (event) {
                event.preventDefault();
                event.stopPropagation();

                Meteor.drawingObject.remove(this);
            }
        }
    );

    Template.drawingObject.rendered = function () {
        Meteor.drawingObject.enableDrag(Template.currentData()._id);
    };


    Template.drawingObject.helpers({
        isEditing: function () {
            return Meteor.spitfire.isEditing(this);
        },
        isVote: function () {
            return this.vote > 0;
        },
        editing: function () {
            return this.editing ? "editing" : "";
        },
        dragging: function () {
            return this.dragging ? "dragging" : "";
        },
        sizing: function () {
            return this.sizing ? "sizing" : "";
        },
        selected: function () {
            return Meteor.select.isSelected(this._id) ? "selected" : "";
        }

    });

})();