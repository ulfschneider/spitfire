Meteor.filter = {
    init: function () {

        Template.filter.events({
                'focusout': function (event) {
                    console.log('focusout');
                },
                'keyup': function (event) {
                    Meteor.spitfire.setFilter(event.target.value);
                }
            }
        );
    }
};