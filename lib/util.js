Meteor.util = {
    clone: function (arg) {
        return JSON.parse(JSON.stringify(arg));
    },
    isArray: function (arg) {
        return arg && Object.prototype.toString.call(arg) === "[object Array]";
    },
    toArray: function (arg) {
        if (Meteor.util.isArray(arg)) {
            return arg;
        } else 

        var ary = [];
        arg.forEach(function (a) {
            ary.push(a)
        });
        return ary;
    }
};