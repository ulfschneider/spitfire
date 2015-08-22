DrawingObjects = new Mongo.Collection('DrawingObjects');

function initHelpers() {
    Handlebars.registerHelper('appTitle', function () {
        return Meteor.spitfire.appTitle();
    });

    Handlebars.registerHelper('sessionName', function () {
        return Meteor.spitfire.sessionName();
    });

    Handlebars.registerHelper('hasSessionName', function () {
        return Meteor.spitfire.hasSessionName();
    });

    Handlebars.registerHelper('isInitialized', function () {
        return Meteor.spitfire.isInitialized();
    });
}

function initRouter() {
    Router.route('/', 'editor');
    Router.route('/about');
    Router.route('/:sessionName/:any1?/:any2?/:any3?', function () {
        //:any parameters are only to deal with the failure case of additional slashes in session name
        var sessionName = this.params.sessionName;
        Meteor.spitfire.setSessionName(sessionName);
        Router.go('/' + sessionName);
        this.render('editor');
    });
}


Meteor.spitfire = {

    hasSessionName: function () {
        return Meteor.spitfire.sessionName() ? true : false;
    },
    sessionName: function () {
        return Session.get('sessionName');
    },
    setSessionName: function (sessionName) {
        Session.set('sessionName', sessionName); //reactivity needed
        Meteor.subscribe('drawingObjects', sessionName);
        document.title = Meteor.spitfire.documentTitle();
    },
    appTitle: function () {
        return 'Spitfire'
    },
    setInitialized: function () {
        Session.set('initialized', true); //reactivity needed
    },
    isInitialized: function () {
        return Session.get('initialized');
    },
    documentTitle: function () {
        if (Meteor.spitfire.hasSessionName()) {
            return Meteor.spitfire.sessionName();
        } else {
            return Meteor.spitfire.appTitle();
        }
    },
    isEdit: function (drawingObject) {
        //initEditing - when a user creates items where an editId is not immediatly available
        //this will avoid the flicker of first displaying an empty non-editing item and
        //changing this item to an editable item. instead will directly show the editable item.
        return (Meteor.text.initId() && Meteor.text.initId() === drawingObject.initId) ||
            (Meteor.text.editId() && Meteor.text.editId() === drawingObject._id);
        //TODO how to switch of edit if 2 minutes no input? timeout action?
    },
    uid: function () {
        return ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(34)).slice(-4);
    },
    prepareSize: function (source, destination) {
        if (source.width && source.height) {
            destination.width = source.width;
            destination.height = source.height;
        }
        return destination;
    },
    prepareZIndex: function (source, destination) {
        if (source.zIndex) {
            destination.zIndex = source.zIndex;
        }
        return destination;
    },

    init: function () {
        Meteor.methods({
                initEditing: function (data) {
                    var now = new Date();
                    var insert = {
                        initId: data.initId,
                        left: data.left,
                        top: data.top,
                        sessionName: data.sessionName,
                        edit: now,
                        modifiedAt: now,
                        createdAt: now
                    };
                    Meteor.spitfire.prepareSize(data, insert);
                    Meteor.spitfire.prepareZIndex(data, insert);

                    return DrawingObjects.insert(insert);

                },
                updateEditing: function (data) {
                    var now = new Date();
                    var update = {
                        initId: null,
                        text: data.text,
                        edit: now,
                        modifiedAt: now
                    };
                    Meteor.spitfire.prepareSize(data, update);
                    Meteor.spitfire.prepareZIndex(data, update);

                    return DrawingObjects.update(data.id, {
                            $set: update
                        }
                    );
                },
                update: function (data) {
                    var update = {
                        initId: null,
                        text: data.text,
                        edit: null,
                        modifiedAt: new Date()
                    };
                    Meteor.spitfire.prepareSize(data, update);
                    Meteor.spitfire.prepareZIndex(data, update);

                    return DrawingObjects.update(data.id, {
                        $set: update
                    });
                },
                removeEditing: function (id) {
                    return DrawingObjects.update(id, {
                            $set: {
                                initId: null,
                                edit: null
                            }
                        }
                    );
                },
                remove: function (id) {
                    DrawingObjects.remove(id);
                },
                updatePosition: function (data) {
                    var update = {
                        initId: null,
                        left: data.left,
                        top: data.top,
                        modifiedAt: new Date()
                    };

                    Meteor.spitfire.prepareZIndex(data, update);

                    return DrawingObjects.update(
                        data.id, {
                            $set: update
                        }
                    );
                },
                resize: function (data) {
                    var update = {
                        initId: null,
                        modifiedAt: new Date()
                    };
                    Meteor.spitfire.prepareSize(data, update);
                    Meteor.spitfire.prepareZIndex(data, update);

                    return DrawingObjects.update(data.id, {
                            $set: update
                        }
                    );

                },
                vote: function (id) {
                    return DrawingObjects.update(
                        id, {
                            $inc: {
                                vote: 1
                            }
                        }
                    );
                },
                downVote: function (id) {
                    var data = DrawingObjects.findOne({_id: id}, {fields: {vote: 1}});

                    if (data && data.vote > 0) {
                        return DrawingObjects.update(
                            id, {
                                $inc: {
                                    vote: -1
                                }

                            }
                        );
                    }
                }


            }
        )
        ;
    },

    initServer: function () {
        Meteor.publish('drawingObjects', function (sessionName) {
            return DrawingObjects.find({sessionName: sessionName});
        });
    }
    ,

    initClient: function () {
        document.title = Meteor.spitfire.documentTitle();
        initHelpers();
        initRouter();

        Meteor.editor.init();
        Meteor.canvas.init();
        Meteor.drawingObject.init();
        Meteor.text.init();

        Meteor.spitfire.setInitialized();
    }

}
;