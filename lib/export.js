Meteor.export = {
    createExportData: function(sessionName) {
        console.log("start to create export for " + sessionName);
        var drawingObjects = DrawingObjects.find({sessionName: sessionName});
        console.log("extracted drawing objects");
        var exportContent = "id;color;top;left;width;fatherId;vote;text\n";
        drawingObjects.forEach(function (drawingObject) {
            exportContent += Meteor.util.isUndefined(drawingObject._id) ? "" : drawingObject._id;
            exportContent += ";";
            exportContent += Meteor.util.isUndefined(drawingObject.color) ? "" : drawingObject.color;
            exportContent += ";";
            exportContent += Meteor.util.isUndefined(drawingObject.top) ? "" : drawingObject.top;
            exportContent += ";";
            exportContent += Meteor.util.isUndefined(drawingObject.left) ? "" : drawingObject.left;
            exportContent += ";";
            exportContent += Meteor.util.isUndefined(drawingObject.width) ? "" : drawingObject.width;
            exportContent += ";";
            exportContent += Meteor.util.isUndefined(drawingObject.fatherId) ? "" : drawingObject.fatherId;
            exportContent += ";";
            exportContent += Meteor.util.isUndefined(drawingObject.vote) ? "" : drawingObject.vote;
            exportContent += ";";

            exportContent += Meteor.util.escapeCSV(drawingObject.text);
            exportContent += "\n";
        });
        console.log(exportContent);
        return exportContent;
    }
}