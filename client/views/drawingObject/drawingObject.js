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
            $('#draggable' + id).draggable({
                scroll: true, helper: 'original', containment: '#canvas', stack: '.draggable'
            });
        } else {
            $('.draggable').draggable({
                scroll: true, helper: 'original', containment: '#canvas', stack: '.draggable'
            });
        }
    }
    ,
    enableResize: function (id) {
        if (id) {
            $('#sizeable' + id).resizable({
                minHeight: 22, minWidth: 22, autoHide: true, handles: "e, se"
            });
        } else {
            $('.sizeable').resizable({
                minHeight: 22, minWidth: 22, autoHide: true, handles: "e, se"
            });
        }
    }
    ,
    resize: function (drawingObject, zIndex, stop) {
        if (drawingObject) {
            var sizeable = $('#sizeable' + drawingObject._id);
            if (sizeable) {
                var width = sizeable.width();
                var height = sizeable.height();
                drawingObject.width = width;
                drawingObject.height = height;
                drawingObject.zIndex = zIndex;
                drawingObject.sizing = stop ? null : new Date();

                if (stop) {
                    var after = JSON.parse(JSON.stringify(drawingObject));
                    Meteor.command.resize(before, after);
                } else {
                    Meteor.call('resize', drawingObject);
                }

            }
        }
    }
    ,
    snapToGrid: function (drawingObject) {
        var draggable = $('#draggable' + drawingObject._id);
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
            Meteor.drawingObject.snapToGrid(drawingObject);
        }
        var position = $('#draggable' + drawingObject._id).position();
        if (position) {

            if (Meteor.select.isSelected()) {
                //update the entire selection


                var xOffset = position.left - drawingObject.left;
                var yOffset = position.top - drawingObject.top;

                var selectedObjects = Meteor.select.getSelectedObjects();
                selectedObjects.forEach(function (selectedObject) {
                    $('#draggable' + selectedObject._id).css({
                        left: selectedObject.left + xOffset,
                        top: selectedObject.top + yOffset
                    });

                    selectedObject.left = selectedObject.left + xOffset;
                    selectedObject.top = selectedObject.top + yOffset;
                    selectedObject.zIndex = zIndex;
                    selectedObject.dragging = stop ? null : new Date();

                });

                if (stop) {
                    Meteor.command.position(before, selectedObjects);
                } else if (persist) {
                    Meteor.call('updatePosition', selectedObjects);
                }


            } else {
                //update only one
                if (persist || stop) {
                    drawingObject.left = position.left;
                    drawingObject.top = position.top;
                    drawingObject.zIndex = zIndex;
                    drawingObject.dragging = stop ? null : new Date();
                    if (stop) {
                        var after = JSON.parse(JSON.stringify(drawingObject));
                        Meteor.command.position(before, after);
                    } else {
                        Meteor.call('updatePosition', drawingObject);
                    }
                }
            }

            dragTime = new Date().getTime();
        }

    }
    ,
    adaptPosition: function (drawingObject, left, top, zIndex) {
        drawingObject.left = left;
        drawingObject.top = top;
        drawingObject.zIndex = zIndex;
    }
    ,
    remove: function (drawingObject) {
        Meteor.command.remove(drawingObject);
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
        var before = JSON.parse(JSON.stringify(selectedObjects));
        if (selectedObjects) {

            var minX = Meteor.canvas.getDrawingWidth();
            selectedObjects.forEach(function (selectedObject) {
                minX = Math.min(selectedObject.left, minX);

            });

            selectedObjects.forEach(function (selectedObject) {
                Meteor.drawingObject.adaptPosition(selectedObject, minX, selectedObject.top);
            });

        }

        Meteor.command.position(before, selectedObjects);
    }
    ,
    alignRight: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = JSON.parse(JSON.stringify(selectedObjects));
        if (selectedObjects) {

            var maxX = 0;
            selectedObjects.forEach(function (selectedObject) {
                maxX = Math.max(selectedObject.left + selectedObject.width, maxX);

            });

            selectedObjects.forEach(function (selectedObject) {
                Meteor.drawingObject.adaptPosition(selectedObject, maxX - selectedObject.width, selectedObject.top);
            });

            Meteor.command.position(before, selectedObjects);
        }
    }
    ,
    alignTop: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = JSON.parse(JSON.stringify(selectedObjects));
        if (selectedObjects) {

            var minY = Meteor.canvas.getDrawingHeight();
            selectedObjects.forEach(function (selectedObject) {
                minY = Math.min(selectedObject.top, minY);

            });

            selectedObjects.forEach(function (selectedObject) {
                Meteor.drawingObject.adaptPosition(selectedObject, selectedObject.left, minY);
            });

            Meteor.command.position(before, selectedObjects);
        }
    }
    ,
    alignBottom: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = JSON.parse(JSON.stringify(selectedObjects));
        if (selectedObjects) {

            var maxY = 0;
            selectedObjects.forEach(function (selectedObject) {
                var uiObject = $('#draggable' + selectedObject._id);
                maxY = Math.max(selectedObject.top + uiObject.height(), maxY);

            });

            selectedObjects.forEach(function (selectedObject) {
                var uiObject = $('#draggable' + selectedObject._id);
                Meteor.drawingObject.adaptPosition(selectedObject, selectedObject.left, maxY - uiObject.height());
            });

            Meteor.command.position(before, selectedObjects);
        }
    }

};

(function () {

    Template.drawingObject.events({
            'dblclick .text': function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                    Meteor.text.editText(this);
                }
            },
            'dragstart': function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    if (!Meteor.select.isSelected(this._id)) {
                        Meteor.command.deSelect();
                    }
                    if (Meteor.select.isSelected()) {
                        before = Meteor.select.getSelectedObjects();
                    } else {
                        before = JSON.parse(JSON.stringify(this));
                    }
                    Meteor.drawingObject.updatePosition(this, true, Meteor.canvas.getMaxZIndex() + 1);
                }
            },
            'drag': function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    var e = $('#editor');
                    if (event.pageX + this.width > e.width()) {
                        e.width(e.width() + 100);
                    }
                    if (event.pageY + this.height > e.height()) {
                        e.height(e.height() + 100);
                    }
                    Meteor.drawingObject.updatePosition(this, false); //intentionally not changing z-index and not persisting
                }
            },
            'dragstop': function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    Meteor.drawingObject.snapToGrid(this);
                    Meteor.drawingObject.updatePosition(this, true, Meteor.canvas.getMaxZIndex() + 1, true);
                }
            },
            'resizestart': function () {
                sizeId = this._id;
                Meteor.command.deSelect();
                before = JSON.parse(JSON.stringify(this));
                Meteor.drawingObject.resize(this, Meteor.canvas.getMaxZIndex() + 1);
                Meteor.canvas.setOverlay(true, this._id);
            },
            'resize': function () {
                Meteor.canvas.setOverlay(true, this._id);
            },
            'resizestop': function () {
                sizeId = null;
                Meteor.canvas.setOverlay(false, this._id);
                Meteor.drawingObject.resize(this, Meteor.canvas.getMaxZIndex() + 1, true);
            },

            'click .vote': function (event) {
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.vote(this);
            },
            'click .down-vote': function (event) {
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.downVote(this);
            },
            'click .sizeable': function (event) {
                if (event.metaKey || event.ctrlKey) {
                    if (Meteor.select.isSelected(this._id)) {
                        Meteor.command.deSelect(this);
                    } else {
                        Meteor.command.select(this);
                    }
                }
            },


            //must be last one, to not produce error: 'must be attached ...'
            'click .delete, dblclick .delete': function (event) {
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
            return this.editing ? 'editing' : '';
        },
        dragging: function () {
            return this.dragging ? 'dragging' : '';
        },
        sizing: function () {
            return this.sizing ? 'sizing' : '';
        },
        selected: function () {
            return Meteor.select.isSelected(this._id) ? 'selected' : '';
        }

    });

})();