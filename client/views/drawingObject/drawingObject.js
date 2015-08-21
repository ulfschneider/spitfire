var dragTime;
var DRAG_UPDATE_DELAY = 100; //milliseconds interval for writing to db


Meteor.drawingObject = {

    checkDragDelay: function () {
        var now = new Date().getTime();
        return now - dragTime > DRAG_UPDATE_DELAY;
    },
    enableDrag: function (id) {
        if (id) {
            $('#draggable' + id).draggable({
                scroll: true, helper: 'original', containment: '#canvas'
            });
        } else {
            $('.draggable').draggable({
                scroll: true, helper: 'original', containment: '#canvas'
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
    updatePosition: function (id, event) {
        var position = $(event.currentTarget).position();

        if (position) {
            Meteor.call('updatePosition', {id: id, left: position.left, top: position.top});
            dragTime = new Date().getTime();
        }
    },
    remove: function (id) {
        if (id) {
            Meteor.call('remove', id);
        }
    },

    init: function () {
        Template.drawingObject.events({
            'dblclick .text': function (event) {
                //same as click .edit
                event.preventDefault();
                event.stopPropagation();
                if (!event.shiftKey) {
                    Meteor.text.editText(this);
                }
            },
            'click': function (event) {
                //click is not supported here, except on links
                event.preventDefault();
                event.stopPropagation();
            },
            'drag': function (event) {

                var e = $('#editor');
                if (event.pageX + 200 > e.width()) {
                    e.width(e.width() + 100);
                }
                if (event.pageY + 200 > e.height()) {
                    e.height(e.height() + 100);
                }

                if (Meteor.drawingObject.checkDragDelay()) {
                    Meteor.drawingObject.updatePosition(this._id, event);
                }
            },
            'dragstop': function (event) {
                Meteor.drawingObject.updatePosition(this._id, event);
            },
            'resizestart': function () {
                Meteor.canvas.setOverlay(true, this._id);
            },
            'resizestop': function () {
                var id = this._id;
                var sizeable = $('#sizeable' + id);
                var width = sizeable.width();
                var height = sizeable.height();
                Meteor.call('resize', {id: this._id, width: width, height: height});
                Meteor.canvas.setOverlay(false, this._id);
            },


            //must be last one, to not produce error: 'must be attached ...'
            'click .delete': function (event) {
                event.preventDefault();
                event.stopPropagation();
                Meteor.drawingObject.remove(this._id);
            }
        });

        Template.drawingObject.rendered = function () {
            Meteor.drawingObject.enableDrag(Template.currentData()._id);
        };


        Template.drawingObject.helpers({
            isEdit: function () {
                return Meteor.spitfire.isEdit(this);
            },
            edit: function () {
                return this.edit ? "edit" : "";
            }
        });

    }

};