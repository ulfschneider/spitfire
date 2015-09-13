var AUTH_PARAM_ID = ',auth';

Meteor.auth = {
    parseAuth: function (url) {
        if (url) {
            return url.toLowerCase().indexOf(AUTH_PARAM_ID) >= 0;
        }
        return false;
    },
    setAuth: function (auth) {
        Session.set('auth', auth === true);
    },
    isAuth: function () {
        return Meteor.user() || Session.get('auth') === true;
    },
    getAuthString: function () {
        if (Meteor.auth.isAuth()) {
            return AUTH_PARAM_ID;
        }
        return '';
    }

};


Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
});