Meteor.filter = {
    setFilter: function (filter) {
        Session.set('filter', filter); //reactivity needed
    },
    getFilter: function () {
        return Session.get('filter');
    },
    getRegExFilter: function () {
        var filter = Meteor.filter.getFilter();
        if (filter && filter.indexOf('--') === 0) {
            filter = filter.substr(2);
            if (filter.length > 0) {
                return '^((?!' + Meteor.spitfire.escapeRegEx(filter) + ').)*$';
            }
        }
        if (filter && (filter === '-' || filter === '--')) {
            return '';
        }
        return Meteor.spitfire.escapeRegEx(filter);

    },
    getNumberFilter: function () {
        var filter = Meteor.filter.getFilter();
        var number = parseInt(filter);
        return number ? number : null;
    },

    init: function () {

        Template.filter.events({
                'keyup': function (event) {
                    Meteor.filter.setFilter(event.target.value);
                }
            }
        );

        Template.filter.rendered = function () {
            var filter = $('#filter');
            filter.val(Meteor.filter.getFilter());
        };
    }
};