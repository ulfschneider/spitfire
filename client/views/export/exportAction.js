Meteor.exportAction = {};


Template.exportAction.helpers({
        hasDrawingObjects: function () {
            return Meteor.spitfire.hasDrawingObjects();
        }
    }
);


