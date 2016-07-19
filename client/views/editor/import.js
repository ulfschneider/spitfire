Meteor.import = {
    extractFiles: function (event) {
        if (event.originalEvent) {
            if (event.originalEvent.dataTransfer) {
                return event.originalEvent.dataTransfer.files;
            }
        }
        return [];
    },
    processFiles: function (files) {
        if (files && files.length > 0) {
            NProgress.start();
            _.each(files, function (f) {

                if (f.type.match("text/plain") || f.type.match("text/csv")) {
                    Meteor.import.processFile(f);
                    Bert.alert("The file " + f.name + " has been imported into " + Meteor.spitfire.appTitle(), 'info', 'growl-bottom-right');
                } else {
                    Bert.alert("You can only import files with a MIME-Type of text/plain or text/csv into " + Meteor.spitfire.appTitle() + ". Usually these files end with .txt or .csv", 'danger', 'growl-bottom-right');
                }
            });

            NProgress.done();
        }
    },
    _processCSV: function (data) {

        var objectsToInsert = [];


        var lines = Meteor.CSV.createJSON(data);

        var height = Meteor.canvas.getDrawingHeight() + 4 * Meteor.text.getDefaultHeight();
        var left = Meteor.grid.getGridIndent();
        var width = Meteor.editor.getWidth();

        _.each(lines, function (line) {
            var object = {};
            object.sessionName = Meteor.spitfire.getSessionName();
            if (line.text) {
                object.text = line.text;

                if (line._id) {
                    object._id = line._id;
                }
                if (line.fatherId) {
                    object.fatherId = line.fatherId;
                }
                if (line.vote) {
                    object.vote = line.vote;
                }
                if (line.color) {
                    object.color = line.color;
                }
                if (line.top) {
                    object.top = line.top;
                } else {
                    object.top = top;
                }
                if (line.left) {
                    object.left = line.left;
                } else {
                    object.left = left;
                }
                if (line.width) {
                    object.width = line.width;
                } else {
                    object.width = Meteor.text.getDefaultWidth();
                }
                if (line.height) {
                    object.height = line.height;
                } else {
                    object.height = Meteor.text.getDefaultHeight();
                }
                if (line.zIndex) {
                    object.zIndex = line.zIndex;
                } else {
                    object.zIndex = Meteor.canvas.getMaxZIndex() + 1;
                }
                objectsToInsert.push(object);
                left = left + object.width + Meteor.text.getDefaultHeight();
                if (left > width) {
                    height = height + 4 * Meteor.text.getDefaultHeight();
                    left = Meteor.grid.getGridIndent();
                }

            }
        });

        return objectsToInsert;
    },
    _processTXT: function (data) {
        var lines = Meteor.import._getFileData(data);
        var height = Meteor.canvas.getDrawingHeight() + 4 * Meteor.text.getDefaultHeight();
        var left = Meteor.grid.getGridIndent();
        var width = Meteor.editor.getWidth();
        var objectsToInsert = [];
        _.each(lines, function (line) {
            objectsToInsert.push({
                sessionName: Meteor.spitfire.getSessionName(),
                text: line,
                top: height,
                left: left,
                width: Meteor.text.getDefaultWidth(),
                height: Meteor.text.getDefaultHeight(),
                zIndex: Meteor.canvas.getMaxZIndex() + 1
            });
            left = left + Meteor.text.getDefaultWidth() + Meteor.text.getDefaultHeight();
            if (left > width) {
                height = height + 4 * Meteor.text.getDefaultHeight();
                left = Meteor.grid.getGridIndent();
            }
        });
        return objectsToInsert;
    },
    processFile: function (file) {
        var reader = new FileReader();
        
        if (file.type.match("text/csv") || Meteor.util.isFileExtension(file.name, "csv")) {
            reader.onload = (function () {
                return function (event) {
                    var objectsToInsert = Meteor.import._processCSV(event.target.result);
                    Meteor.command.insert(objectsToInsert);
                }
            })(file);
        } else if (file.type.match("text/plain") || Meteor.util.isFileExtension(file.name, "txt")) {
            reader.onload = (function () {
                return function (event) {
                    var objectsToInsert = Meteor.import._processTXT(event.target.result);
                    Meteor.command.insert(objectsToInsert);
                }
            })(file);
        }

        reader.readAsText(file);
    },
    _getFileData: function (data) {
        //create drawingObject from each line of text in data
        var trimmedLines = [];
        if (data) {
            var lines = data.split("\n");

            _.each(lines, function (line) {
                var l = $.trim(Meteor.util.replaceLineBreaks(line, " "));
                if (l.length > 0) {
                    trimmedLines.push(l);
                }
            });
        }
        return trimmedLines;
    },
    handleFileDrag: function (event) {
        if (event.originalEvent) {
            if (event.originalEvent.dataTransfer) {
                event.originalEvent.dataTransfer.dropEffect = "copy";
            }
        }
    }
}