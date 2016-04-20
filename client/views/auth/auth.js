"use strict";

Meteor.auth = {
    setAuth: function (auth) {
        if (Meteor.auth.isAuth() !== (true === auth)) {
            Session.set("auth", auth === true);
        }
    },
    isAuth: function () {
        return Meteor.user() || true === Session.get("auth");
    }
};


Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});