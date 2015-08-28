Meteor.spitfire.init();

if (Meteor.isClient) {
    Meteor.spitfire.initClient();

}

if (Meteor.isServer) {
    Meteor.spitfire.initServer();
}
