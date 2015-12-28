

var editText;
var editId;
var initId;
var INPUT_TIME_OUT = 1000 * 60 * 2; //2 minutes
var INPUT_UPDATE = 1000; //ONE seconds
var DEFAULT_WIDTH = 200;
var DEFAULT_HEIGHT = 20;
var inputTimeoutId;
var inputUpdateId;
var before;

Meteor.text = {
    clearText: function () {
        editText = null;
        editId = null;
        initId = null;
        before = null;
        Meteor.text.cleanUpInputUpdate();
        Meteor.text.cleanUpInputTimeout();
    },
    editId: function () {
        return editId;
    },
    initId: function () {
        return initId;
    },
    isEditing: function () {
        return editId || initId;
    },
    endEditing: function () {
        if (Meteor.text.isEditing()) {
            Meteor.text.submitText();
        } else {
            Meteor.text.clearText();
        }
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
        Meteor.text.cleanUpInputTimeout();
        inputTimeoutId = setTimeout(function () {
            if (Meteor.text.editId()) {
                Meteor.text.removeEditingById(Meteor.text.editId());
            }
            Meteor.text.clearText();
        }, INPUT_TIME_OUT);
    },
    cleanUpInputTimeout: function () {
        if (inputTimeoutId) {
            clearTimeout(inputTimeoutId);
            inputTimeoutId = null;
        }
    }
    ,
    setInputUpdate: function () {
        if (!Meteor.text.hasInputUpdate()) {
            inputUpdateId = setTimeout(function () {
                Meteor.text.updateEditing();
                Meteor.text.cleanUpInputUpdate();
            }, INPUT_UPDATE);
        }
    },
    hasInputUpdate: function () {
        return inputUpdateId;
    },
    cleanUpInputUpdate: function () {
        if (inputUpdateId) {
            clearTimeout(inputUpdateId);
            inputUpdateId = null;
        }
    }
    ,
    editText: function (drawingObject) {
        if (!editId) {
            before = JSON.parse(JSON.stringify(drawingObject));
            editText = drawingObject.text;
            editId = drawingObject._id;
            Meteor.text.setInputTimeout();
            drawingObject.text = editText;
            drawingObject.zIndex = Meteor.canvas.getMaxZIndex() + 1;
            Meteor.call("updateEditing", drawingObject);
        }
    }
    ,
    submitText: function () {
        if (editId) {
            var textControl = $("#textinput" + editId);
            Meteor.text.cleanUpInputTimeout();
            if (textControl) {
                var text = textControl.val();
                if (!text) {
                    if (before) {
                        Meteor.command.remove(before);
                    } else {
                        Meteor.call("removeById", editId);
                    }
                } else {
                    Meteor.command.submit(before, {
                        _id: editId,
                        sessionName: Meteor.spitfire.getSessionName(),
                        text: text,
                        width: textControl.width(),
                        height: textControl.height(),
                        top: textControl.position().top,
                        left: textControl.position().left,
                        zIndex: Meteor.canvas.getMaxZIndex() + 1
                    });
                }
            }
            Meteor.text.clearText();
        }

    }
    ,
    initEditing: function (event) {
        //initEditing - when a user creates items where an editId is not immediatly available
        if (event && !editId && !initId) {
            initId = Meteor.spitfire.uid();
            Meteor.text.setInputTimeout();
            Meteor.call("initEditing", {
                sessionName: Meteor.spitfire.getSessionName(),
                initId: initId,
                left: Meteor.grid.snapLeft(event.pageX),
                top: Meteor.grid.snapTop(event.pageY),
                width: Meteor.text.getDefaultWidth(),
                height: Meteor.text.getDefaultHeight(),
                zIndex: Meteor.canvas.getMaxZIndex() + 1
            }, function (error, result) {
                editId = result;
            });
        }
    },

    updateEditing: function () {
        if (editId) {
            var textControl = $("#textinput" + editId);
            if (textControl) {
                var text = textControl.val();

                if (text != null) {
                    var width = textControl.width();
                    var height = textControl.height();

                    if (text != null) {
                        Meteor.call("updateEditing", {
                            _id: editId,
                            text: text,
                            width: width,
                            height: height
                        });
                    }
                }
            }
        }
    }
    ,
    removeEditingById: function (id) {
        Meteor.call("removeEditingById", id);
    }
    ,
    blankTargets: function (id) {
        var childLinks = $("#sizeable" + id + " a");
        for (var i = 0; i < childLinks.length; i++) {
            $(childLinks[i]).attr("target", "_blank");
        }
    },
    getDefaultWidth: function () {
        return DEFAULT_WIDTH;
    },
    getDefaultHeight: function () {
        return DEFAULT_HEIGHT;
    }


};


(function () {
    Template.textInput.events({
            "click, dblclick, mousedown": function (event) {
                event.stopPropagation();
            },
            "keydown": function (event) {
                event.stopPropagation();
            },
            "keypress": function (event) {
                if (event.which && event.which === 13 || event.keyCode && event.keyCode === 13) {
                    if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
                        Meteor.text.submitText();
                        event.preventDefault();
                    }
                }
                event.stopPropagation();
            },
            "keyup": function (event) {
                if (event.which && event.which === 27 || event.keyCode && event.keyCode === 27) {
                    Meteor.text.submitText();
                } else {
                    var text = event.target.value;
                    Meteor.text.setInputTimeout();
                    if (editText != text) {
                        editText = text;
                        Meteor.text.setInputUpdate();
                    }
                }
                event.preventDefault();
                event.stopPropagation();
            },

            "focusout, blur": function () {
                Meteor.text.submitText();
            }

        }
    );


    Template.textInput.rendered = function () {
        var textControl = $("#textinput" + Template.currentData()._id);
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
            return ""; //will set auto height that fits to content
        }

    });

    Template.text.rendered = function () {
        Meteor.drawingObject.enableDrag(Template.currentData()._id);
        Meteor.drawingObject.enableResize(Template.currentData()._id);
        Meteor.text.blankTargets(Template.currentData()._id);
    }


})();