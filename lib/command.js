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
        for (var i = 0; i < commands.length; i++) {
            console.log("" + i + ": " + commands[i].name);
        }
    },
    _createCommand: function (name, before, after, exec, unexec) {
        return {name: name, before: before, after: after, exec: exec, unexec: unexec};
    },
    _adaptIdInCommands: function (from, to) {

        for (var i = 0; i < commands.length; i++) {
            if (commands[i].before) {
                if (Meteor.util.isArray(commands[i].before)) {
                    for (var j = 0; j < commands[i].before.length; j++) {
                        if (commands[i].before[j]._id === from) {
                            commands[i].before[j]._id = to;
                        }
                        if (commands[i].before[j].fatherId === from) {
                            commands[i].before[j].fatherId = to;
                        }
                    }
                } else {
                    if (commands[i].before._id === from) {
                        commands[i].before._id = to;
                    }
                    if (commands[i].before.fatherId === from) {
                        commands[i].before.fatherId = to;
                    }
                }
            }

            if (commands[i].after) {
                if (Meteor.util.isArray(commands[i].after)) {
                    for (j = 0; j < commands[i].after.length; j++) {
                        if (commands[i].after[j]._id === from) {
                            commands[i].after[j]._id = to;
                        }
                        if (commands[i].after[j].fatherId === from) {
                            commands[i].after[j].fatherId = to;
                        }
                    }
                } else {
                    if (commands[i].after._id === from) {
                        commands[i].after._id = to;
                    }
                    if (commands[i].after.fatherId === from) {
                        commands[i].after.fatherId = to;
                    }

                }
            }

        }
    },
    _adaptAllIds: function (from, to, bulkId) {
        var adapt = DrawingObjects.find({fatherId: from, bulkId: bulkId});
        adapt.forEach(function (object) {
            Meteor.call("connectById", object._id, to);
        });
        Meteor.command._adaptIdInCommands(from, to);
    },

    //list of commands
    insert: function (after) {
        var command = Meteor.command._createCommand("insert", null, after,
            function (before, after) {
                //exec
                var bulkId = Meteor.spitfire.uid();
                if (Meteor.util.isArray(after) && after.length > 0) {
                    for (var i = 0; i < after.length; i++) {
                        after[i].bulkId = bulkId;
                        Meteor.call("insert", after[i], function (error, result) {
                            Meteor.command._adaptAllIds(result.givenId, result._id, bulkId);
                        });
                    }
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
                    Meteor.call("insert", before,
                        function (error, result) {
                            //after inserting, the "before" data will have a new id
                            //therefore all references to the old id need to be
                            //replaced by the new id
                            Meteor.command._adaptAllIds(result.givenId, result._id, bulkId);
                        });
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
                    Meteor.call("insert", after, function (error, id) {
                        Meteor.command._adaptAllIds(after._id, id);
                    });
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
                Meteor.call("setColorById", after._id, after.color ? after.color : null);
            },
            function (before /*, after*/) {
                //unexec
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
        if (!before && Meteor.select.isSelected()) {
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
    connect: function (before) {
        var command = Meteor.command._createCommand("connect", before, null,
            function (before) {
                //exec
                Meteor.drawingObject.connect(before._id, before.fatherId);
            },
            function (before) {
                //unexec
                Meteor.drawingObject.unConnect(before._id, true);
            }
        );
        Meteor.command.execute(command);
    },

};

