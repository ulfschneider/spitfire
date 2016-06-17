Meteor.export = {
    createExportData: function(sessionName) {
        var drawingObjects = DrawingObjects.find({sessionName: sessionName});
        var exportContent = "id;color;top;left;width;fatherId;vote;text\n";
        drawingObjects.forEach(function (drawingObject) {
            exportContent += Meteor.util.isUndefinedOrNull(drawingObject._id) ? "" : drawingObject._id;
            exportContent += ";";
            exportContent += Meteor.util.isUndefinedOrNull(drawingObject.color) ? "" : drawingObject.color;
            exportContent += ";";
            exportContent += Meteor.util.isUndefinedOrNull(drawingObject.top) ? "" : drawingObject.top;
            exportContent += ";";
            exportContent += Meteor.util.isUndefinedOrNull(drawingObject.left) ? "" : drawingObject.left;
            exportContent += ";";
            exportContent += Meteor.util.isUndefinedOrNull(drawingObject.width) ? "" : drawingObject.width;
            exportContent += ";";
            exportContent += Meteor.util.isUndefinedOrNull(drawingObject.fatherId) ? "" : drawingObject.fatherId;
            exportContent += ";";
            exportContent += Meteor.util.isUndefinedOrNull(drawingObject.vote) ? "" : drawingObject.vote;
            exportContent += ";";

            exportContent += Meteor.util.isUndefinedOrNull(drawingObject.text) ? "" : Meteor.util.escapeCSV(drawingObject.text);
            exportContent += "\n";
        });
        return exportContent;
    }
}