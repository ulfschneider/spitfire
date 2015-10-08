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
            if (commands[i].before && commands[i].before._id === from) {
                commands[i].before._id = to;
            }
            if (commands[i].after && commands[i].after._id === from) {
                commands[i].after._id = to;
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

    },
    submit: function (before, after) {
        var command = Meteor.command.createCommand('submit', before, after,
            function (before, after) {
                //exec
                Meteor.call('update', after);
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
    },
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
    },
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
    },

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
    },
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
    },
    unselect: function () {
        if (Meteor.select.isSelected()) {
            var before = JSON.parse(JSON.stringify(Meteor.select.getSelectedIds()));
            var command = Meteor.command.createCommand('unselect', before, null,
                function (before, after) {
                    //exec
                    Meteor.select.clearSelect();
                },
                function (before, after) {
                    //unexec
                    Meteor.select.clearSelect();
                    if (before) {
                        before.forEach(function (object) {
                            Meteor.select.select(object);
                        });
                    }
                }
            );
            Meteor.command.execute(command);
        }
    }
}

;

