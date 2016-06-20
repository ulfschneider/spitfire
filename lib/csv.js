Meteor.CSV = {

    createCSV: function (sessionName) {
        var drawingObjects = DrawingObjects.find({sessionName: sessionName});
        var csv = Papa.unparse({
            fields: Meteor.CSV.fields(),
            data: Meteor.util.toArray(drawingObjects)
        });

        return csv;
    },
    createJSON: function(csv) {
        var parseResults = Papa.parse(csv, {header:true, skipEmptyLines:true, dynamicTyping:true});
        if (parseResults.errors.length) {
            return [];
        } else {
            return parseResults.data;
        }
    },
    fields: function() {
        return ["_id", "fatherId", "top", "left", "width", "height", "color", "vote", "text"];
    }
}