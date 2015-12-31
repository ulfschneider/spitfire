Meteor.util = {
    clone: function(arg) {
        return JSON.parse(JSON.stringify(arg));
    },
    isArray: function (arg) {
        return arg && Object.prototype.toString.call(arg) === "[object Array]";
    }
};