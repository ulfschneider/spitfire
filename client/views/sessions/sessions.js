Meteor.sessions = {
    getMostRecent: function (d1, d2) {
        if (d1 && d2) {
            if (d1.getTime() > d2.getTime()) {
                return d1;
            } else {
                return d2;
            }
        }
        return d1 || d2;
    }
};

(function () {

    Template.sessions.helpers({
            sessionData: function () {
                return SessionData.find();
            }
        }
    );

    Template.session.helpers({
        sessionName: function () {
            return this.sessionName;
        },
        modifiedAt: function () {
            return moment(this.modifiedAt).calendar();
        }

    })

})();