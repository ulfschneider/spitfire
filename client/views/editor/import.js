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
            for (var i = 0; i < files.length; i++) {
                var f = files[i];

                if (f.type.match("text/plain") || f.type.match("text/csv")) {
                    Meteor.import.processFile(f);
                    Bert.alert("The file " + f.name + " has been imported into " + Meteor.spitfire.appTitle(), 'info', 'growl-bottom-right');
                } else {
                    Bert.alert("You can only import files with a MIME-Type of text/plain or text/csv into " + Meteor.spitfire.appTitle() + ". Usually these files end with .txt or .csv", 'danger', 'growl-bottom-right');
                }
            }
            NProgress.done();
        }
    },
    _processCSV: function (data) {

        var objectsToInsert = [];


        var lines = Meteor.CSV.createJSON(data);

        var height = Meteor.canvas.getDrawingHeight() + 4 * Meteor.text.getDefaultHeight();
        var left = Meteor.grid.getGridIndent();
        var width = Meteor.editor.getWidth();

        for (var i = 0; i < lines.length; i++) {
            var object = {};
            object.sessionName = Meteor.spitfire.getSessionName();
            if (lines[i].text) {
                object.text = lines[i].text;

                if (lines[i]._id) {
                    object._id = lines[i]._id;
                }
                if (lines[i].fatherId) {
                    object.fatherId = lines[i].fatherId;
                }
                if (lines[i].vote) {
                    object.vote = lines[i].vote;
                }
                if (lines[i].color) {
                    object.color = lines[i].color;
                }
                if (lines[i].top) {
                    object.top = lines[i].top;
                } else {
                    object.top = top;
                }
                if (lines[i].left) {
                    object.left = lines[i].left;
                } else {
                    object.left = left;
                }
                if (lines[i].width) {
                    object.width = lines[i].width;
                } else {
                    object.width = Meteor.text.getDefaultWidth();
                }
                if (lines[i].height) {
                    object.height = lines[i].height;
                } else {
                    object.height = Meteor.text.getDefaultHeight();
                }
                if (lines[i].zIndex) {
                    object.zIndex = lines[i].zIndex;
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
        }

        return objectsToInsert;
    },
    _processTXT: function (data) {
        var lines = Meteor.import._getFileData(data);
        var height = Meteor.canvas.getDrawingHeight() + 4 * Meteor.text.getDefaultHeight();
        var left = Meteor.grid.getGridIndent();
        var width = Meteor.editor.getWidth();
        var objectsToInsert = [];
        for (var i = 0; i < lines.length; i++) {
            objectsToInsert.push({
                sessionName: Meteor.spitfire.getSessionName(),
                text: lines[i],
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
        }
        return objectsToInsert;
    },
    processFile: function (file) {
        var reader = new FileReader();

        if (file.type.match("text/csv")) {
            reader.onload = (function () {
                return function (event) {
                    var objectsToInsert = Meteor.import._processCSV(event.target.result);
                    Meteor.command.insert(objectsToInsert);
                }
            })(file);
        } else if (file.type.match("text/plain")) {
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

            for (var i = 0; i < lines.length; i++) {
                var l = $.trim(Meteor.util.replaceLineBreaks(lines[i], " "));
                if (l.length > 0) {
                    trimmedLines.push(l);
                }
            }
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