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
                if (f.type.match("text.*")) {
                    Meteor.import.processFile(f);
                } else {
                    alert("The file " + f.name + " could not be imported into " + Meteor.spitfire.appTitle());
                }
            }
            NProgress.done();
        }
    },
    processFile: function (file) {
        var reader = new FileReader();
        reader.onload = (function () {
            return function (event) {
                var lines = Meteor.CSV.createJSON(event.target.result);

                //var lines = Meteor.import._getFileData(event.target.result);
                var height = Meteor.canvas.getDrawingHeight() + 4 * Meteor.text.getDefaultHeight();
                var left = Meteor.grid.getGridIndent();
                var width = Meteor.editor.getWidth();
                var objectsToInsert = [];
                for (var i = 0; i < lines.length; i++) {
                    objectsToInsert.push({
                        _id: lines[i]._id,
                        sessionName: Meteor.spitfire.getSessionName(),
                        fatherId: lines[i].fatherId,
                        text: lines[i].text,
                        vote: lines[i].vote,
                        top: lines[i].top,
                        left: lines[i].left,
                        width: lines[i].width,
                        height: lines[i].height,
                        color: lines[i].color,
                        zIndex: lines[i].zIndex
                    });
                    left = left + Meteor.text.getDefaultWidth() + Meteor.text.getDefaultHeight();
                    if (left > width) {
                        height = height + 4 * Meteor.text.getDefaultHeight();
                        left = Meteor.grid.getGridIndent();
                    }
                }
                Meteor.command.insert(objectsToInsert);

            }
        })(file);
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