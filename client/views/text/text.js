var editText;
var editId;
var initId;
var INPUT_TIME_OUT = 1000 * 60 * 2; //2 minutes
var inputTimeoutId;

Meteor.text = {
    clearText: function () {
        editText = null;
        editId = null;
    },
    editId: function () {
        return editId;
    },
    initId: function () {
        return initId;
    },
    isInputTimeout: function (drawingObject) {
        if (drawingObject && drawingObject.editing) {
            var now = new Date();
            return now.getTime() - drawingObject.editing.getTime() > INPUT_TIME_OUT;
        } else {
            return false;
        }
    },
    setInputTimeout: function () {
        Meteor.text.cleanupInputTimeout();
        inputTimeoutId = setTimeout(function () {
            if (Meteor.text.editId()) {
                Meteor.text.removeEditing(Meteor.text.editId());
            }
            Meteor.text.clearText();
        }, INPUT_TIME_OUT);
    },
    cleanupInputTimeout: function () {
        if (inputTimeoutId) {
            clearTimeout(inputTimeoutId);
        }
    },
    editText: function (drawingObject) {
        if (!editId) {
            editText = drawingObject.text;
            editId = drawingObject._id;
            Meteor.text.setInputTimeout();
            Meteor.call('updateEditing', {
                id: drawingObject._id,
                text: editText,
                zIndex: Meteor.canvas.maxZIndex() + 1
            });
        }

    },
    submitText: function (event) {
        if (event && editId) {
            var text = event.target.value;
            var textControl = $('#textinput' + editId);
            Meteor.text.cleanupInputTimeout();
            if (textControl) {

                if (!text) {
                    Meteor.drawingObject.remove(editId);
                    Meteor.text.clearText();
                } else {
                    Meteor.call('update', {
                        id: editId,
                        text: text,
                        width: textControl.width(),
                        height: textControl.height(),
                        zIndex: Meteor.canvas.maxZIndex() + 1
                    });
                    Meteor.text.clearText();
                }
            }
        }
    },
    initEditing: function (event) {
        //initEditing - when a user creates items where an editId is not immediatly available
        if (event && !editId) {
            initId = Meteor.spitfire.uid();
            Meteor.text.setInputTimeout();
            Meteor.call('initEditing', {
                sessionName: Meteor.spitfire.getSessionName(),
                initId: initId,
                left: event.pageX.valueOf(),
                top: event.pageY.valueOf(),
                width: 200,
                height: 20,
                zIndex: Meteor.canvas.maxZIndex() + 1
            }, function (error, result) {
                editId = result;
            });
        }
    },

    updateEditing: function (event) {
        if (event && editId) {
            var text;
            var textControl = $('#textinput' + editId);
            text = event.target.value;
            Meteor.text.cleanupInputTimeout();

            if (text != null && textControl) {
                var width = textControl.width();
                var height = textControl.height();

                if (text != null) {
                    Meteor.call('updateEditing', {
                        id: editId,
                        text: text,
                        width: width,
                        height: height
                    });
                }
            }
        }
    },
    removeEditing: function (id) {
        Meteor.call('removeEditing', id);
    },


    init: function () {

        Template.textInput.events({
                'focusout': function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.text.submitText(event);
                },
                'keypress': function (event) {
                    if (event.which && event.which === 13 || event.keyCode && event.keyCode === 13) {
                        if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
                            event.preventDefault();
                            event.stopPropagation();
                            Meteor.text.submitText(event);
                        }
                    }
                },
                'keyup': function (event) {
                    if (event.which && event.which === 27 || event.keyCode && event.keyCode === 27) {
                        event.preventDefault();
                        event.stopPropagation();
                        Meteor.text.submitText(event);
                    } else {
                        var text = event.target.value;
                        Meteor.text.setInputTimeout();
                        if (editText != text) {
                            editText = text;
                            Meteor.text.updateEditing(event);
                        }
                    }

                }
            }
        );


        Template.textInput.rendered = function () {
            var textControl = $('#textinput' + Template.currentData()._id);
            textControl.val(editText);
            textControl.autosize();
            textControl.focus();
        };


        Template.text.helpers({
            hasSize: function () {
                return this.width && this.width > 0 && this.height && this.height > 0;
            },
            votableText: function () {
                if (this.vote && this.vote > 0) {
                    return '<span class="vote-count">' + this.vote + '</span>' + this.text;
                } else {
                    return this.text;
                }
            },
            height: function () {
                return ''; //will set auto height that fits to content
            }

        });


        Template.text.rendered = function () {
            Meteor.drawingObject.enableDrag(Template.currentData()._id);
            Meteor.drawingObject.enableResize(Template.currentData()._id);
        }
    }
};
