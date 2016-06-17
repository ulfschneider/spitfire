

Meteor.exportAction = {

   
};

(function () {
    Template.exportAction.helpers({
            hasDrawingObjects:function() {
                return Meteor.spitfire.hasDrawingObjects();
            }
        }
    );

})();
