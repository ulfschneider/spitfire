Meteor.export = {
    createCSVData: function (sessionName) {
        var drawingObjects = DrawingObjects.find({sessionName: sessionName});
        var csv = Papa.unparse({
            fields: ["_id", "color", "top", "left", "width", "fatherId", "vote", "text"],
            data: Meteor.util.toArray(drawingObjects)
        });

        return csv;
    }
}