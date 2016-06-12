var dragTime;
var sizeId;
var CLEANUP_DRAG_OR_SIZE_TIME_OUT = 1000 * 30; //milliseconds interval
var MOVE_TIME_OUT = 100; //millisecnds
var before;


Meteor.drawingObject = {
    isDragTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.dragging) {
            var now = new Date();
            return now.getTime() - drawingObject.dragging.getTime() > CLEANUP_DRAG_OR_SIZE_TIME_OUT;
        }
        else {
            return false;
        }
    }
    ,
    isSizeTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.sizing) {
            var now = new Date();
            return now.getTime() - drawingObject.sizing.getTime() > CLEANUP_DRAG_OR_SIZE_TIME_OUT;
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
            $("#" + id)
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
                    minHeight: 17, minWidth: 17, autoHide: true, handles: "e, se"
                });
        } else {
            $(".sizeable")
                .resizable({
                    minHeight: 17, minWidth: 17, autoHide: true, handles: "e, se"
                });
        }
    }
    ,
    resize: function (drawingObject, zIndex, persist, stop) {
        if (drawingObject) {
            var sizeable = $("#sizeable" + drawingObject._id);
            if (sizeable) {
                var width = sizeable.width();
                var height = sizeable.height();
                drawingObject.width = width;
                drawingObject.height = height;
                drawingObject.zIndex = zIndex;
                drawingObject.sizing = stop ? null : new Date();
                Meteor.drawingObject._drawConnections(drawingObject._id, true);

                if (stop) {
                    var after = Meteor.util.clone(drawingObject);
                    Meteor.command.resize(before, after);
                } else if (persist) {
                    Meteor.call("resize", drawingObject);
                }

            }
        }
    }
    ,
    _snapToGrid: function (drawingObject) {
        var draggable = $("#" + drawingObject._id);
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

        var position = $("#" + drawingObject._id)
            .position();
        if (position) {

            if (Meteor.select.isSelected()) {
                //update the entire selection

                var xOffset = position.left - drawingObject.left;
                var yOffset = position.top - drawingObject.top;

                var selectedObjects = Meteor.select.getSelectedObjects();
                for (var i = 0; i < selectedObjects.length; i++) {
                    $("#" + selectedObjects[i]._id)
                        .css({
                            left: selectedObjects[i].left + xOffset,
                            top: selectedObjects[i].top + yOffset
                        });

                    selectedObjects[i].left = selectedObjects[i].left + xOffset;
                    selectedObjects[i].top = selectedObjects[i].top + yOffset;
                    selectedObjects[i].zIndex = zIndex;
                    selectedObjects[i].dragging = stop ? null : new Date();
                    Meteor.drawingObject._drawConnections(selectedObjects[i]._id, true);
                }

                if (stop) {
                    Meteor.command.position(before, selectedObjects);
                } else if (persist) {
                    Meteor.call("updatePosition", selectedObjects);
                }
            } else {
                //update only one
                drawingObject.left = position.left;
                drawingObject.top = position.top;
                drawingObject.zIndex = zIndex;
                drawingObject.dragging = stop ? null : new Date();
                Meteor.drawingObject._drawConnections(drawingObject._id, true);
                if (persist || stop) {
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
    clearFatherId: function () {
        Session.set("fatherId", null);
    },
    getFatherId: function () {
        return Session.get("fatherId");
    },
    setFatherId: function (fatherId) {
        Session.set("fatherId", fatherId);
    },
    _getSonObjectIds: function (id) {
        var sonIds = [];
        var sons = $("[father=" + id + "]");
        for (var i = 0; i < sons.length; i++) {
            sonIds.push(sons[i].id);
        }
        return sonIds;
    }
    ,
    _getFatherObjectId: function (id) {
        var me = $("#" + id);
        var fatherId = me.attr("father");
        if (fatherId) {
            return fatherId;
        }
        return "";
    }
    ,
    _getConnectionIds: function (id) {
        var connectionIds = [];
        var sons = $("[id^=father" + id + "]");
        for (var i = 0; i < sons.length; i++) {
            connectionIds.push(sons[i].id);
        }
        var father = $("[id$=-son" + id + "]")[0];

        if (father) {
            connectionIds.push(father.id);
        }
        return connectionIds;
    }
    ,
    _getAllConnections: function () {
        return $("[id^=father]");
    }
    ,
    _hasObject: function (drawingObjects, id) {
        var hasObject = false;
        $.each(drawingObjects, function (object) {
            if (object._id === id) {
                hasObject = true;
            }
            return hasObject;
        });
        return hasObject;
    }
    ,
    cleanupConnections: function () {
        var connections = Meteor.drawingObject._getAllConnections();

        for (var i = 0; i < connections.length; i++) {
            connections[i].remove();
        }
    }
    ,
    _drawConnections: function (id, useTimer) {
        var sonIds = Meteor.drawingObject._getSonObjectIds(id);
        for (var i = 0; i < sonIds.length; i++) {
            Meteor.drawingObject._drawLine(id, sonIds[i]);
        }

        var fatherId = Meteor.drawingObject._getFatherObjectId(id);
        if (fatherId) {
            Meteor.drawingObject._drawLine(fatherId, id);
        }
        if (useTimer) {
            setTimeout(function () {
                Meteor.drawingObject._drawConnections(id);
            }, MOVE_TIME_OUT);
        }
    }
    ,
    _drawLine: function (fatherId, sonId) {
        var svg = Meteor.canvas.getSvg();
        var line = $("#father" + fatherId + "-son" + sonId)[0];
        if (!line) {
            line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        }
        line.setAttribute("id", "father" + fatherId + "-son" + sonId);

        var father = $("#" + fatherId);
        var son = $("#" + sonId);

        if (father.length && son.length && fatherId !== sonId) {
            if (father.position().left + father.outerWidth() < son.position().left) {
                line.setAttribute("x1", father.position().left + father.outerWidth());
            } else {
                line.setAttribute("x1", father.position().left);
            }
            if (father.position().top + father.outerHeight() < son.position().top) {
                line.setAttribute("y1", father.position().top + father.outerHeight());
            } else {
                line.setAttribute("y1", father.position().top);
            }
            if (son.position().left + son.outerWidth() < father.position().left) {
                line.setAttribute("x2", son.position().left + son.outerWidth());
            } else {
                line.setAttribute("x2", son.position().left);
            }
            if (son.position().top + son.outerHeight() < father.position().top) {
                line.setAttribute("y2", son.position().top + son.outerHeight())
            } else {
                line.setAttribute("y2", son.position().top);
            }
            line.setAttribute("stroke", "#111");
            line.setAttribute("style", "marker-end: url(#markerArrow)");
            svg.appendChild(line);
        } else {
            line.remove();
        }
    }
    ,
    connect: function (sonId, fatherId) {
        var _fatherId = fatherId;
        if (!_fatherId) {
            _fatherId = Meteor.drawingObject.getFatherId();
        }
        if (_fatherId) {
            Meteor.drawingObject.unConnect(sonId);
            Meteor.drawingObject._drawLine(_fatherId, sonId);

            Meteor.call("connectById", sonId, fatherId);
        }
        Meteor.drawingObject.setFatherId(sonId);
    }
    ,
    unConnect: function (sonId, persist) {
        var connect = $("[id$=-son" + sonId + "]");
        connect.remove();
        if (persist) {
            Meteor.call("unConnectById", sonId);
        }
    }
    ,
    remove: function (drawingObject) {
        if (drawingObject) {
            Meteor.command.remove(Meteor.util.clone(drawingObject));
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

        for (var i = 0; i < selectedObjects.length; i++) {
            minX = Math.min(selectedObjects[i].left, minX);
        }
        for (var i = 0; i < selectedObjects.length; i++) {
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

        for (var i = 0; i < selectedObjects.length; i++) {
            maxX = Math.max(selectedObjects[i].left + selectedObjects[i].width, maxX);
        }
        for (var i = 0; i < selectedObjects.length; i++) {
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

        for (var i = 0; i < selectedObjects.length; i++) {
            minY = Math.min(selectedObjects[i].top, minY);
        }
        for (var i = 0; i < selectedObjects.length; i++) {
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

        for (var i = 0; i < selectedObjects.length; i++) {
            uiObject = $("#" + selectedObjects[i]._id);
            maxY = Math.max(selectedObjects[i].top + uiObject.height(), maxY);
        }
        for (var i = 0; i < selectedObjects.length; i++) {
            uiObject = $("#" + selectedObjects[i]._id);
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
    }
    ,
    move: function (left, top) {
        var selectedObjects = Meteor.select.getSelectedObjects();
        var before = Meteor.util.clone(selectedObjects);
        var stop = false;
        var i;

        if (left < 0 || top < 0) {
            for (var i = 0; i < selectedObjects.length; i++) {
                if (left < 0 && selectedObjects[i].left + left <= 0) {
                    stop = true;
                } else if (top < 0 && selectedObjects[i].top + top <= 0) {
                    stop = true;
                }
            }
        }
        if (!stop) {
            for (var i = 0; i < selectedObjects.length; i++) {
                Meteor.drawingObject._adaptPosition(selectedObjects[i], selectedObjects[i].left + left, selectedObjects[i].top + top);
            }

            Meteor.command.position(before, selectedObjects);
        }
    }

}
;

(function () {

    Template.drawingObject.events({
            "click .text a": function (event) {
                if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
                    event.preventDefault();
                    if (event.altKey) {
                        Meteor.command.connect({_id: this._id, fatherId: Meteor.drawingObject.getFatherId()});
                    } else if (event.ctrlKey || event.metaKey) {
                        if (Meteor.select.isSelected(this._id)) {
                            Meteor.command.unSelect(this);
                        } else {
                            Meteor.command.select(this);
                        }
                    }
                }
                event.stopPropagation();
            },
            "click .text, dblclick .text": function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                    Meteor.text.editText(this);
                } else if (event.altKey) {
                    Meteor.command.connect({_id: this._id, fatherId: Meteor.drawingObject.getFatherId()});
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
                    Meteor.drawingObject.updatePosition(this); //intentionally not changing z-index and not persisting

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
                Meteor.drawingObject.resize(this, Meteor.canvas.getMaxZIndex() + 1, true);
            },
            "resize": function () {
                Meteor.drawingObject.resize(this, Meteor.canvas.getMaxZIndex());
            },
            "resizestop": function () {
                sizeId = null;
                Meteor.drawingObject.resize(this, Meteor.canvas.getMaxZIndex() + 1, true, true);
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
            "pick": function(event) {
                before = Meteor.util.clone(this);
                var after = Meteor.util.clone(this);
                after.color = event.color;
                Meteor.command.setColor(before, after);
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
        Meteor.drawingObject._drawConnections(Template.currentData()._id);
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
        },
        isConnect: function () {
            return Meteor.drawingObject.getFatherId() === this._id;
        },
        father: function () {
            Meteor.drawingObject._drawConnections(this._id);
            return this.fatherId;
        },
        connect: function () {
            return Meteor.drawingObject.getFatherId() === this._id ? "connect" : "";
        }
    });

})();


//TODO undo/redo not working properly for both - simple and together with creating/removing drawingObjects
//TODO calling sequence for commands is not clear, undo/redo not stable
//TODO performance
//TODO allow multiple fathers

//TODO package docu
//TODO package test?




