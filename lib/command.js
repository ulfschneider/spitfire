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

    //list of commands
    remove: function (before, after) {
        var command = Meteor.command.createCommand('remove', before, after,
            function (before) {
                //exec
                if (before) {
                    Meteor.call('remove', before);
                }
            },
            function (before) {
                //unexec
                if (before) {
                    Meteor.call('insert', before);
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
    drag: function (before, after) {
        var command = Meteor.command.createCommand('drag', before, after,
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

};

