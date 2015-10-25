DrawingObjects = new Mongo.Collection('DrawingObjects');
SessionData = new Mongo.Collection('SessionData');

var PARAM_DELIMITER = ',';

function initHelpers() {
    Handlebars.registerHelper('appTitle', function () {
        return Meteor.spitfire.appTitle();
    });

    Handlebars.registerHelper('sessionName', function () {
        return Meteor.spitfire.getSessionName();
    });

    Handlebars.registerHelper('home', function () {
        return Meteor.spitfire.getHome();
    });

    Handlebars.registerHelper('hasSessionName', function () {
        return Meteor.spitfire.hasSessionName();
    });

    Handlebars.registerHelper('isInitialized', function () {
        return Meteor.spitfire.isInitialized();
    });

    Handlebars.registerHelper('minGrid', function () {
        return Meteor.grid.getMinGrid();
    });
}


function initRouter() {
    Router.configure({
        progressDelay: 100,
        progressSpinner: false,
        progressTick: false,
        loadingTemplate: 'loading'
    });

    Router.route('/', 'editor');
    Router.route('/about', {progress: false});
    Router.route('/sessions', {
        waitOn: function () {
            return Meteor.subscribe('sessionData');
        }
    });
    Router.route('/:sessionName/:any1?/:any2?/:any3?', function () {
            //:any parameters are only to deal with the failure case of additional slashes in session name
            var sessionName = this.params.sessionName;

            if (!Meteor.grid.hasGrid()) {
                var grid = Meteor.grid.parseGrid(sessionName);
                Meteor.grid.setGrid(grid);
            }

            var auth = Meteor.auth.parseAuth(sessionName);
            Meteor.auth.setAuth(auth);


            var paramIdx = sessionName.indexOf(PARAM_DELIMITER);
            if (paramIdx >= 0) {
                sessionName = sessionName.substring(0, paramIdx);
            }

            Meteor.spitfire.setSessionName(sessionName);

            this.render('editor');

            if (Meteor.spitfire.getHome() !== Router.current().location.get().pathname) {
                Router.go(Meteor.spitfire.getHome());
            }
        }, {
            waitOn: function () {
                return Meteor.subscribe('drawingObjects', Meteor.spitfire.getSessionName())
            }
        }
    );
}


Meteor.spitfire = {
    hasSessionName: function () {
        return Meteor.spitfire.getSessionName() ? true : false;
    },
    getSessionName: function () {
        return Session.get('sessionName');
    },
    setSessionName: function (sessionName) {
        if (Meteor.spitfire.getSessionName() !== sessionName) {
            Session.set('sessionName', sessionName); //reactivity needed
        }
    },
    escapeRegEx: function (s) {
        return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },
    appTitle: function () {
        return 'Spitfire'
    },
    getHome: function () {
        return '/' + Meteor.spitfire.getSessionName() + Meteor.grid.getGridString() + Meteor.auth.getAuthString();
    },
    setInitialized: function () {
        Session.set('initialized', true); //reactivity needed
    },
    isInitialized: function () {
        return Session.get('initialized');
    },
    documentTitle: function () {
        if (Meteor.spitfire.hasSessionName()) {
            return Meteor.spitfire.getSessionName();
        } else {
            return Meteor.spitfire.appTitle();
        }
    },
    isAdmin: function (user) {
        if (!user && Meteor.isClient()) {
            user = Meteor.user();
        }
        if (user) {
            return user && user.username && user.username.toLowerCase() === 'admin'
        }
        return false;
    },
    isEditing: function (drawingObject) {
        //initEditing - when a user creates items where an editId is not immediatly available
        //this will avoid the flicker of first displaying an empty non-editing item and
        //changing this item to an editable item. instead will directly show the editable item.
        return (Meteor.text.initId() && Meteor.text.initId() === drawingObject.initId) ||
            (Meteor.text.editId() && Meteor.text.editId() === drawingObject._id);
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
    preparePosition: function (source, destination) {
        if (source.left && source.top) {
            destination.top = source.top;
            destination.left = source.left;
        }
        return destination;
    },
    prepareZIndex: function (source, destination) {
        if (source.zIndex) {
            destination.zIndex = source.zIndex;
        }
        return destination;
    },
    prepareEditing: function (source, destination) {
        if (source.editing || source.editing == null) {
            destination.editing = source.editing;
        }
        if (source.initId || source.initId == null) {
            destination.initId = source.initId;
        }
        return destination;
    },
    prepareDragging: function (source, destination) {
        if (source.dragging || source.dragging == null) {
            destination.dragging = source.dragging;
        }
        return destination;
    },
    prepareSizing: function (source, destination) {
        if (source.sizing || source.sizing == null) {
            destination.sizing = source.sizing;
        }
        return destination;
    },
    prepareSessionName: function (source, destination) {
        if (source.sessionName) {
            destination.sessionName = source.sessionName;
        }
        return destination;
    },
    getUser: function () {
        var user = Meteor.user();
        if (user && user.username) {
            return user.username;
        } else if (user && user.emails[0]) {
            return user.emails[0].address;
        }
        return null;
    },
    validateBeforeInsert: function (data, text) {
        if (!data.sessionName) {
            console.error('Can not insert object because of missing sessionName: ' + JSON.stringify(update));
            return false;
        } else if (text && !data.text) {
            console.error('Can not insert object because of missing text: ' + JSON.stringify(update));
            return false;
        } else if (!data.width) {
            console.error('Can not insert object because of missing width: ' + JSON.stringify(update));
            return false;
        } else if (!data.height) {
            console.error('Can not insert object because of missing height: ' + JSON.stringify(update));
            return false;
        } else if (!data.zIndex) {
            console.error('Can not insert object because of missing zIndex: ' + JSON.stringify(update));
            return false;
        } else if (data.top && !data.left || data.left && !data.top) {
            console.error('Can not insert object because of missing positioning: ' + JSON.stringify(update));
            return false;
        }
        return true;
    },

    initServer: function () {
        Meteor.publish('drawingObjects', function (sessionName) {
            return DrawingObjects.find({sessionName: sessionName});
        });

        Meteor.publish('sessionData', function () {

                if (this.userId) {
                    var user = Meteor.users.findOne({
                        _id: this.userId
                    });

                    if (Meteor.spitfire.isAdmin(user)) {
                        return SessionData.find({'sessionName': {$ne: null}}, {
                            sort: {modifiedAt: -1}
                        });
                    }
                }

                return [];
            }
        );

        Meteor.methods({
            maintainSessionData: function (data) {
                if (data.sessionName) {
                    var session = SessionData.findOne({sessionName: data.sessionName});
                    if (session) {
                        return SessionData.update({_id: session._id}, {
                            $set: {
                                sessionName: data.sessionName,
                                user: Meteor.spitfire.getUser(),
                                modifiedAt: new Date()
                            }
                        });
                    } else {
                        return SessionData.insert({
                            sessionName: data.sessionName,
                            user: Meteor.spitfire.getUser(),
                            modifiedAt: new Date()
                        });
                    }
                }
            }
        });


    },

    initClient: function () {
        initHelpers();
        initRouter();

        Meteor.spitfire.setInitialized();
    }
};

(function () {
    Meteor.methods({
            initEditing: function (data) {
                var now = new Date();
                var insert = {
                    initId: data.initId,
                    sessionName: data.sessionName,
                    editing: now,
                    modifiedAt: now,
                    createdAt: now,
                    user: Meteor.spitfire.getUser()
                };
                Meteor.spitfire.preparePosition(data, insert);
                Meteor.spitfire.prepareSize(data, insert);
                Meteor.spitfire.prepareZIndex(data, insert);
                if (Meteor.spitfire.validateBeforeInsert(data)) {
                    return DrawingObjects.insert(insert);
                }
            },
            updateEditing: function (data) {
                var now = new Date();
                var update = {
                    initId: null,
                    text: data.text,
                    editing: now,
                    modifiedAt: now
                };
                Meteor.spitfire.prepareSize(data, update);
                Meteor.spitfire.prepareZIndex(data, update);
                return DrawingObjects.update(data._id, {
                        $set: update
                    }
                );
            },
            update: function (data) {
                var update = {
                    initId: null,
                    text: data.text,
                    editing: null,
                    modifiedAt: new Date(),
                    user: Meteor.spitfire.getUser()
                };
                Meteor.spitfire.preparePosition(data, update);
                Meteor.spitfire.prepareSize(data, update);
                Meteor.spitfire.prepareZIndex(data, update);
                Meteor.spitfire.prepareSessionName(data, update);


                if (data._id) {
                    Meteor.call('maintainSessionData', update);
                    return DrawingObjects.update(data._id, {
                        $set: update
                    });
                } else if (Meteor.spitfire.validateBeforeInsert(update, true)) {
                    Meteor.call('maintainSessionData', update);
                    return DrawingObjects.insert(update);
                }

            },
            insert: function (data) {

                var insert = data;
                if (data._id) {
                    insert = JSON.parse(JSON.stringify(data));
                    insert._id = null;
                }
                insert.createdAt = new Date;

                return Meteor.call('update', insert);
            },
            removeEditingById: function (id) {
                var data = DrawingObjects.findOne({_id: id});

                if (data && !data.text) {
                    return DrawingObjects.remove(id);
                } else {
                    return DrawingObjects.update(id, {
                            $set: {
                                initId: null,
                                editing: null
                            }
                        }
                    );
                }
            }
            ,
            cleanUp: function (data) {
                var cleanup = {
                    modifiedAt: new Date()
                };
                Meteor.spitfire.prepareEditing(data, cleanup);
                Meteor.spitfire.prepareDragging(data, cleanup);
                Meteor.spitfire.prepareSizing(data, cleanup);
                return DrawingObjects.update(data._id, {
                    $set: cleanup
                });
            }
            ,
            remove: function (data) {
                Meteor.call('maintainSessionData', data);
                DrawingObjects.remove(data._id);
            }
            ,
            removeById: function (id) {
                var data = DrawingObjects.findOne({_id: id});
                if (data) {
                    Meteor.call('remove', data);
                }
            }
            ,
            updateSinglePosition: function (data) {
                var update = {
                    initId: null,
                    dragging: data.dragging,
                    modifiedAt: new Date(),
                    user: Meteor.spitfire.getUser()
                };
                Meteor.spitfire.preparePosition(data, update);
                Meteor.spitfire.prepareZIndex(data, update);
                Meteor.spitfire.prepareSessionName(data, update);
                Meteor.call('maintainSessionData', update);
                return DrawingObjects.update(
                    data._id, {
                        $set: update
                    }
                );
            }
            ,
            updatePosition: function (data) {
                if (Object.prototype.toString.call(data) === '[object Array]') {
                    data.forEach(function (object) {
                        Meteor.call('updateSinglePosition', object);
                    });
                } else {
                    Meteor.call('updateSinglePosition', data);
                }
            },
            resize: function (data) {
                var update = {
                    initId: null,
                    sizing: data.sizing,
                    modifiedAt: new Date(),
                    user: Meteor.spitfire.getUser()
                };

                Meteor.spitfire.prepareSize(data, update);
                Meteor.spitfire.prepareZIndex(data, update);
                Meteor.spitfire.prepareSessionName(data, update);
                Meteor.call('maintainSessionData', update);
                return DrawingObjects.update(data._id, {
                        $set: update
                    }
                );

            }
            ,
            vote: function (data) {
                Meteor.call('maintainSessionData', data);
                return DrawingObjects.update(
                    data._id, {
                        $inc: {
                            vote: 1
                        }, $set: {
                            user: Meteor.spitfire.getUser()
                        }
                    }
                );
            }
            ,
            downVote: function (data) {
                var one = DrawingObjects.findOne({_id: data._id}, {fields: {vote: 1}});

                if (one && one.vote > 0) {
                    Meteor.call('maintainSessionData', data);
                    return DrawingObjects.update(
                        data._id, {
                            $inc: {
                                vote: -1
                            }, $set: {
                                user: Meteor.spitfire.getUser()
                            }
                        }
                    );
                }
            }
        }
    )
    ;
})
();
