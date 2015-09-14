(function () {

    Template.sessions.helpers({
            sessionData: function () {
                return SessionData.find({}, {sort: {modifiedAt: -1}});
            }
        }
    );

    Template.session.helpers({
        sessionName: function () {
            return this.sessionName;
        },
        user:function() {
            return this.user;
        },
        modifiedAt: function () {
            return moment(this.modifiedAt).calendar();
        }

    })

})();