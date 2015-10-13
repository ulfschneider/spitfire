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
    listCommands: function () {
        console.log('command pointer ' + commandPointer);
        console.log('command list size ' + commands.length);
        for (i = 0; i < commands.length; i++) {
            console.log('' + i + ': ' + commands[i].name);
        }
    },

    createCommand: function (name, before, after, exec, unexec) {
        return {name: name, before: before, after: after, exec: exec, unexec: unexec};
    },
    adaptId: function (from, to) {
        for (i = 0; i < commands.length; i++) {

            if (commands[i].before) {
                if (commands[i].name === 'select' || commands[i].name === 'unselect') {
                    //TODO modify before ids of select
                } else if (commands[i].before._id === from) {
                    commands[i].before._id = to;
                }
            }
            if (commands[i].after) {
                if (commands[i].name === 'select' || commands[i].name === 'unselect') {
                    //TODO modify after ids of select
                } else if (commands[i].after._id === from) {
                    commands[i].after._id = to;
                }
            }
        }
    },

    //list of commands
    remove: function (before) {
        var command = Meteor.command.createCommand('remove', before, null,
            function (before) {
                //exec
                if (before) {
                    Meteor.call('remove', before);
                }
            },
            function (before) {
                //unexec
                if (before) {
                    Meteor.call('insert', before,
                        function (error, id) {
                            //after inserting, the before data will have a new id
                            //therefore all references to the old id need to be
                            //replaced by the new id
                            Meteor.command.adaptId(before._id, id);
                        });
                }
            }
        );
        Meteor.command.execute(command);

    }
    ,
    submit: function (before, after) {
        var command = Meteor.command.createCommand('submit', before, after,
            function (before, after) {
                //exec
                var one = DrawingObjects.findOne({_id: after._id});
                if (one) {
                    Meteor.call('update', after);
                } else {
                    Meteor.call('insert', after, function (error, id) {
                        Meteor.command.adaptId(after._id, id);
                    });
                }
            },
            function (before, after) {
                //unexec
                if (before) {
                    Meteor.call('update', before);
                } else {
                    Meteor.call('remove', after);
                }
            }
        );
        Meteor.command.execute(command);
    }
    ,
    vote: function (before) {

        var command = Meteor.command.createCommand('vote', before, null,
            function (before) {
                //exec
                Meteor.call('vote', before);
            },
            function (before) {
                //unexec
                Meteor.call('downVote', before);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    downVote: function (before) {
        var command = Meteor.command.createCommand('downVote', before, null,
            function (before) {
                //exec
                Meteor.call('downVote', before);
            },
            function (before) {
                //unexec
                Meteor.call('vote', before);
            }
        );
        Meteor.command.execute(command);
    }
    ,

    position: function (before, after) {
        var command = Meteor.command.createCommand('position', before, after,
            function (before, after) {
                //exec
                Meteor.call('updatePosition', after);
            },
            function (before, after) {
                //unexec
                Meteor.call('updatePosition', before);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    resize: function (before, after) {
        var command = Meteor.command.createCommand('resize', before, after,
            function (before, after) {
                //exec
                Meteor.call('resize', after);
            },
            function (before, after) {
                //unexec
                Meteor.call('resize', before);
            }
        );
        Meteor.command.execute(command);
    }
    ,
    select: function (before) {
        if (Object.prototype.toString.call(before) === '[object Array]') {
            var ids = [];
            before.forEach(function (object) {
                ids.push(object._id);
            });
            var command = Meteor.command.createCommand('select', ids, null,
                function (before) {
                    //exec
                    before.forEach(function (id) {
                        Meteor.select.select(id);
                    });
                },
                function (before) {
                    //unexec
                    before.forEach(function (id) {
                        Meteor.select.deSelect(id);
                    });
                }
            );
            Meteor.command.execute(command);
        } else if (before) {
            var id = before._id;
            var command = Meteor.command.createCommand('select', id, null,
                function (before) {
                    //exec
                    Meteor.select.select(before);
                },
                function (before) {
                    //unexec
                    Meteor.select.deSelect(before);
                }
            );
            Meteor.command.execute(command);
        }
    }
    ,
    deSelect: function (before) {
        if (!before && Meteor.select.isSelected()) {

            var ids = JSON.parse(JSON.stringify(Meteor.select.getSelectedIds()));
            var command = Meteor.command.createCommand('unselect', ids, null,
                function () {
                    //exec
                    Meteor.select.clearSelect();
                },
                function (before) {
                    //unexec
                    Meteor.select.clearSelect();
                    if (before) {
                        before.forEach(function (id) {
                            Meteor.select.select(id);
                        });
                    }
                }
            );
            Meteor.command.execute(command);
        } else if (before && !(Object.prototype.toString.call(before) === '[object Array]')) {
            var id = before._id;
            var command = Meteor.command.createCommand('unselect', id, null,
                function (before) {
                    //exec
                    Meteor.select.deSelect(before);
                },
                function (before) {
                    //unexec
                    Meteor.select.select(before);
                }
            );
            Meteor.command.execute(command);
        }
    }
}

;

