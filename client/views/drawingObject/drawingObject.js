var dragTime;
var DRAG_UPDATE_DELAY = 100; //milliseconds interval for writing to db
var sizeId;
var DRAG_OR_SIZE_TIME_OUT = 1000 * 30; //milliseconds interval


Meteor.drawingObject = {
    isDragTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.dragging) {
            var now = new Date();
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
    checkDragDelay: function () {
        var now = new Date().getTime();
        return now - dragTime > DRAG_UPDATE_DELAY;
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
                        $('#draggable' + object._id).css({left: object.left + xOffset, top: object.top + yOffset});
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

            var minX = Meteor.canvas.drawingWidth();
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

            var minY = Meteor.canvas.drawingHeight();
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
                maxY = Math.max(object.top + object.height, maxY);

            });

            selectedObjects.forEach(function (object) {
                Meteor.drawingObject.setPosition(object._id, object.left, maxY - object.height);
            });
        }
    },


    init: function () {
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
                        Meteor.drawingObject.updatePosition(this._id, true, Meteor.canvas.maxZIndex() + 1);
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
                        Meteor.drawingObject.updatePosition(this._id, false); //intentionally not changing z-index
                        //TODO maybe persist the position update after drag delay? Anyway to only persist on dragstop is much more efficient for the database
                    }
                },
                'dragstop': function (event) {
                    if (!event.ctrlKey && !event.metaKey) {
                        Meteor.drawingObject.updatePosition(this._id, true, Meteor.canvas.maxZIndex() + 1, true);
                    }
                },
                'resizestart': function () {
                    sizeId = this._id;
                    Meteor.select.clearSelect();
                    Meteor.drawingObject.resize(this._id, Meteor.canvas.maxZIndex() + 1);
                    Meteor.canvas.setOverlay(true, this._id);
                },
                'resize': function () {
                    Meteor.canvas.setOverlay(true, this._id);
                },
                'resizestop': function () {
                    sizeId = null;
                    Meteor.canvas.setOverlay(false, this._id);
                    Meteor.drawingObject.resize(this._id, Meteor.canvas.maxZIndex() + 1, true);
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

    }

};