var commands = [];
var commandPointer = 0; //points behind last executed command

Meteor.command = {
    execute: function (command) {
        if (command) {
            command.exec(command.before, command.after);
            if (commandPointer < commands.length) {
                commands.splice(commandPointer);
            }
            commands.push(command);
            commandPointer++;
        }
    },
    undo: function () {
        if (commandPointer > 0) {
            commandPointer--;
            commands[commandPointer].unexec(commands[commandPointer].before, commands[commandPointer].after);
        }

    },
    redo: function () {
        if (commandPointer < commands.length) {
            commands[commandPointer].exec(commands[commandPointer].before, commands[commandPointer].after);
            commandPointer++;
        }
    },
    _listCommands: function () {
        console.log("command pointer " + commandPointer);
        console.log("command list size " + commands.length);
        _.each(commands, function (command) {
            console.log("" + i + ": " + command.name);
        });
    },
    _createCommand: function (name, before, after, exec, unexec) {
        return {name: name, before: before, after: after, exec: exec, unexec: unexec};
    },

    //list of commands
    insert: function (after) {
        var command = Meteor.command._createCommand("insert", null, after,
            function (before, after) {

                //exec

                if (Meteor.util.isArray(after) && after.length > 0) {
                    var bulkId = Meteor.util.uid();
                    _.each(after, function (a) {
                        a.bulkId = bulkId;

                        //make sure that ids do not interfere with already stored content
                        a._id = Meteor.util.decorateId(a._id, bulkId, "bulk");
                        a.fatherId = Meteor.util.decorateId(a.fatherId, bulkId, "bulk");

                        Meteor.call("insert", a, true);
                    });
                } else {
                    var bulkId = Meteor.util.uid();

                    after.bulkId = bulkId;

                    //make sure that ids do not interfere with already stored content
                    after._id = Meteor.util.decorateId(after._id, bulkId, "bulk");
                    after.fatherId = Meteor.util.decorateId(after.fatherId, bulkId, "bulk");

                    Meteor.call("insert", after, true);

                }
            },
            function (before, after) {
                //unexec
                if (Meteor.util.isArray(after) && after.length > 0) {
                    var bulkInsert = DrawingObjects.find({bulkId: after[0].bulkId});

                    bulkInsert.forEach(function (object) {
                            Meteor.call("removeById", object._id);
                        }
                    );

                }
            }
        );
        Meteor.command.execute(command);
    }
    ,
    remove: function (before) {
        var command = Meteor.command._createCommand("remove", before, null,
            function (before) {
                //exec
                if (before) {
                    Meteor.call("remove", before);

                }
            },
            function (before) {
                //unexec
                if (before) {
                    Meteor.call("insert", before, true);
                }
            }
        );
        Meteor.command.execute(command);

    }
    ,
    submit: function (before, after) {
        var command = Meteor.command._createCommand("submit", before, after,
            function (before, after) {
                //exec
                var one = Meteor.spitfire.loadDrawingObject(after._id);
                if (one) {
                    Meteor.call("update", after);
                } else {
                    Meteor.call("insert", after, true);
                }
            },
            function (before, after) {
                //unexec
                if (before) {
                    Meteor.call("update", before);
                } else {
                    Meteor.call("removeById", after._id);
                }
            }
        );
        Meteor.command.execute(command);
    }
    ,

    vote: function (before) {

        var command = Meteor.command._createCommand("vote", before, null,
            function (before) {
                //exec
                Meteor.call("vote", before);
            },
            function (before) {
                //unexec
                Meteor.call("downVote", before);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    downVote: function (before) {
        var command = Meteor.command._createCommand("downVote", before, null,
            function (before) {
                //exec
                Meteor.call("downVote", before);
            },
            function (before) {
                //unexec
                Meteor.call("vote", before);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    position: function (before, after) {
        var command = Meteor.command._createCommand("position", before, after,
            function (before, after) {
                //exec
                Meteor.call("updatePosition", after);
            },
            function (before /*, after*/) {
                //unexec
                Meteor.call("updatePosition", before);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    resize: function (before, after) {
        var command = Meteor.command._createCommand("resize", before, after,
            function (before, after) {
                //exec
                Meteor.call("resize", after);
            },
            function (before /*, after*/) {
                //unexec
                Meteor.call("resize", before);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    setColor: function (before, after) {
        var command = Meteor.command._createCommand("setColor", before, after,
            function (before, after) {
                //exec
                Meteor.drawingObject.setCurrentColor(after.color);
                Meteor.call("setColorById", after._id, after.color ? after.color : null);
            },
            function (before, after) {
                //unexec
                if (before.color !== after.color) {
                    Meteor.drawingObject.setCurrentColor(before.color);
                }
                Meteor.call("setColorById", before._id, before.color ? before.color : null);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    select: function (before) {

        var ids = Meteor.spitfire.getIds(before);

        var command = Meteor.command._createCommand("select", ids, null,
            function (before) {
                //exec
                Meteor.select.select(before);
            },
            function (before) {
                //unexec
                Meteor.select.unSelect(before);
            }
        );
        Meteor.command.execute(command);

    },
    unSelect: function (before) {
        var ids, command;
        if (Meteor.util.isUndefinedOrNull(before) && Meteor.select.isSelected()) {
            ids = Meteor.util.clone(Meteor.select.getSelectedIds());
            command = Meteor.command._createCommand("unselect", ids, null,
                function () {
                    //exec
                    Meteor.select.clearSelect();
                },
                function (before) {
                    //unexec
                    Meteor.select.clearSelect();
                    if (before) {
                        Meteor.select.select(before);
                    }
                }
            );
            Meteor.command.execute(command);
        } else if (before) {
            ids = Meteor.spitfire.getIds(before);
            command = Meteor.command._createCommand("unselect", ids, null,
                function (before) {
                    //exec
                    Meteor.select.unSelect(before);
                },
                function (before) {
                    //unexec
                    Meteor.select.select(before);
                }
            );
            Meteor.command.execute(command);
        }
    },
    connect: function (before, after) {
        var command = Meteor.command._createCommand("connect", before, after,
            function (before, after) {
                //exec
                Meteor.drawingObject.connect(after._id, after.fatherId);
            },
            function (before /*, after*/) {
                //unexec
                if (Meteor.util.isUndefinedOrNull(before.fatherId)) {
                    Meteor.drawingObject.unConnect(before._id, true);
                } else {
                    Meteor.drawingObject.connect(before._id, before.fatherId);
                }
            }
        );
        Meteor.command.execute(command);
    },

};

