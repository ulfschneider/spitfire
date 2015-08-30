Meteor.filter = {
    init: function () {

        Template.filter.events({
                'keyup': function (event) {
                    Meteor.spitfire.setFilter(event.target.value);
                }
            }
        );
    }
};