var dragTime;
var sizeId;
var DRAG_OR_SIZE_TIME_OUT = 1000 * 30; //milliseconds interval


Meteor.drawingObject = {
    isDragTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.dragging) {
            var now = new Date();
            return now.getTime() - drawingObject.dragging.getTime() > DRAG_OR_SIZE_TIME_OUT;
            return now.getTime() - drawingObject.dragging.getTime() > DRAG_OR_SIZE_TIME_OUT;
        } else {
            return false;
        }
    },
    isSizeTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.sizing) {
            var now = new Date();
            return now.getTime() - drawingObject.sizing.getTime() > DRAG_OR_SIZE_TIME_OUT;
        } else {
            return false;
        }
    },
    getSizeId: function () {
        return sizeId;
    },
    clearSizing: function () {
        sizeId = null;
    },
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
    },
    enableResize: function (id) {
        if (id) {
            $('#sizeable' + id).resizable({
                minHeight: 22, minWidth: 22, autoHide: true
            });
        } else {
            $('.sizeable').resizable({
                minHeight: 22, minWidth: 22, autoHide: true
            });
        }
    },
    resize: function (id, zIndex, stop) {
        if (id) {
            var sizeable = $('#sizeable' + id);
            if (sizeable) {
                var width = sizeable.width();
                var height = sizeable.height();

                Meteor.call('resize', {
                    id: id,
                    width: width,
                    height: height,
                    zIndex: zIndex,
                    sizing: stop ? null : new Date()
                });

            }
        }
    },
    snapToGrid: function (id) {
        var draggable = $('#draggable' + id);
        if (draggable) {
            var position = draggable.position();
            if (position) {
                var l = Meteor.grid.snapLeft(position.left);
                var t = Meteor.grid.snapTop(position.top);
                draggable.css({left: l, top: t});
            }
        }
    },
    updatePosition: function (id, persist, zIndex, stop) {

        var position = $('#draggable' + id).position();
        if (position) {

            if (Meteor.select.isSelected()) {
                //update the entire selection
                var current = DrawingObjects.findOne({_id: id});
                if (current) {
                    var xOffset = position.left - current.left;
                    var yOffset = position.top - current.top;

                    var selectedObjects = Meteor.select.getSelectedObjects();
                    selectedObjects.forEach(function (object) {
                        $('#draggable' + object._id).css({
                            left: object.left + xOffset,
                            top: object.top + yOffset
                        });
                        if (persist || stop) {
                            Meteor.call('updatePosition', {
                                id: object._id,
                                left: object.left + xOffset,
                                top: object.top + yOffset,
                                zIndex: zIndex,
                                dragging: stop ? null : new Date()
                            });
                        }
                    });
                }
            } else {
                //update only one
                if (persist || stop) {
                    Meteor.call('updatePosition', {
                        id: id,
                        left: position.left,
                        top: position.top,
                        zIndex: zIndex,
                        dragging: stop ? null : new Date()
                    });
                }
            }

            dragTime = new Date().getTime();
        }

    },
    setPosition: function (id, left, top, zIndex) {
        Meteor.call('updatePosition', {
            id: id,
            left: left,
            top: top,
            zIndex: zIndex
        });
    },
    remove: function (id) {
        Meteor.call('remove', id);
    },
    vote: function (id) {
        Meteor.call('vote', id);
    },
    downVote: function (id) {
        Meteor.call('downVote', id);
    },
    alignLeft: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        if (selectedObjects) {

            var minX = Meteor.canvas.getDrawingWidth();
            selectedObjects.forEach(function (object) {
                minX = Math.min(object.left, minX);

            });

            selectedObjects.forEach(function (object) {
                Meteor.drawingObject.setPosition(object._id, minX, object.top);
            });
        }
    },
    alignRight: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        if (selectedObjects) {

            var maxX = 0;
            selectedObjects.forEach(function (object) {
                maxX = Math.max(object.left + object.width, maxX);

            });

            selectedObjects.forEach(function (object) {
                Meteor.drawingObject.setPosition(object._id, maxX - object.width, object.top);
            });
        }
    },
    alignTop: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        if (selectedObjects) {

            var minY = Meteor.canvas.getDrawingHeight();
            selectedObjects.forEach(function (object) {
                minY = Math.min(object.top, minY);

            });

            selectedObjects.forEach(function (object) {
                Meteor.drawingObject.setPosition(object._id, object.left, minY);
            });
        }
    },
    alignBottom: function () {
        var selectedObjects = Meteor.select.getSelectedObjects();
        if (selectedObjects) {

            var maxY = 0;
            selectedObjects.forEach(function (object) {
                var uiObject = $('#draggable' + object._id);
                maxY = Math.max(object.top + uiObject.height(), maxY);

            });

            selectedObjects.forEach(function (object) {
                var uiObject = $('#draggable' + object._id);
                Meteor.drawingObject.setPosition(object._id, object.left, maxY - uiObject.height());
            });
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
                        Meteor.select.clearSelect();
                    }
                    Meteor.drawingObject.updatePosition(this._id, true, Meteor.canvas.getMaxZIndex() + 1);
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
                    Meteor.drawingObject.updatePosition(this._id, false); //intentionally not changing z-index and not persisting
                }
            },
            'dragstop': function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    Meteor.drawingObject.snapToGrid(this._id);
                    Meteor.drawingObject.updatePosition(this._id, true, Meteor.canvas.getMaxZIndex() + 1, true);
                }
            },
            'resizestart': function () {
                sizeId = this._id;
                Meteor.select.clearSelect();
                Meteor.drawingObject.resize(this._id, Meteor.canvas.getMaxZIndex() + 1);
                Meteor.canvas.setOverlay(true, this._id);
            },
            'resize': function () {
                Meteor.canvas.setOverlay(true, this._id);
            },
            'resizestop': function () {
                sizeId = null;
                Meteor.canvas.setOverlay(false, this._id);
                Meteor.drawingObject.resize(this._id, Meteor.canvas.getMaxZIndex() + 1, true);
            },

            'click .vote, dblclick .vote': function (event) {
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.vote(this._id);
            },
            'click .down-vote, dblclick .down-vote': function (event) {
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.downVote(this._id);
            },
            'click .sizeable': function (event) {
                if (event.metaKey || event.ctrlKey) {
                    if (Meteor.select.isSelected(this._id)) {
                        Meteor.select.deSelect(this._id);
                    } else {
                        Meteor.select.select(this._id);
                    }
                }
            },


            //must be last one, to not produce error: 'must be attached ...'
            'click .delete, dblclick .delete': function (event) {
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.remove(this._id);
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