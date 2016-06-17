

Meteor.filter = {
    setFilter: function (filter) {
        Session.set("filter", filter); //reactivity needed
    },
    getFilter: function () {
        return Session.get("filter");
    },
    getRegExFilter: function () {
        var filter = Meteor.filter.getFilter();
        if (filter && filter.indexOf("--") === 0) {
            filter = filter.substr(2);
            if (filter.length > 0) {
                return "^((?!" + Meteor.util.escapeRegEx(filter) + ").)*$";
            }
        }
        if (filter && (filter === "-" || filter === "--")) {
            return "";
        }
        return Meteor.util.escapeRegEx(filter);

    },
    getNumberFilter: function () {
        var filter = Meteor.filter.getFilter();
        var number = parseInt(filter);
        return number ? number : null;
    }
};

(function () {

    Template.filter.events({
            "keypress": function (event) {
                if (event.which && event.which === 13 || event.keyCode && event.keyCode === 13) {
                    event.preventDefault();
                    event.currentTarget.blur();
                }
                event.stopPropagation();
            },

            "keyup": function (event) {
                Meteor.filter.setFilter(event.target.value);

                if (event.which && event.which === 27 || event.keyCode && event.keyCode === 27) {
                    event.preventDefault();
                    event.currentTarget.blur();
                }

                event.stopPropagation();
            },
            "keydown": function (event) {
                event.stopPropagation();
            }
        }
    );

    Template.filter.rendered = function () {
        var filter = $("#filter");
        filter.val(Meteor.filter.getFilter());
    };
})();