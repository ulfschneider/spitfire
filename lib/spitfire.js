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


    init: function () {
        Meteor.methods({
                initEditing: function (data) {
                    var now = new Date();
                    var insert = {
                        initId: data.initId,
                        left: data.left,
                        top: data.top,
                        sessionName: data.sessionName,
                        editing: now,
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
                        editing: now,
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
                        editing: null,
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
                                editing: null
                            }
                        }
                    );
                },
                cleanUp: function (data) {
                    var cleanup = {
                        modifiedAt: new Date()
                    };
                    Meteor.spitfire.prepareEditing(data, cleanup);
                    Meteor.spitfire.prepareDragging(data, cleanup);
                    Meteor.spitfire.prepareSizing(data, cleanup);
                    return DrawingObjects.update(data.id, {
                        $set: cleanup
                    });
                },
                remove: function (id) {
                    DrawingObjects.remove(id);
                },
                updatePosition: function (data) {
                    var update = {
                        initId: null,
                        left: data.left,
                        top: data.top,
                        dragging: data.dragging,
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
                        sizing: data.sizing,
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
        );
    },

    initServer: function () {
        Meteor.publish('drawingObjects', function (sessionName) {
            return DrawingObjects.find({sessionName: sessionName});
        });
    },

    initClient: function () {
        document.title = Meteor.spitfire.documentTitle();
        initHelpers();
        initRouter();

        Meteor.editor.init();
        Meteor.canvas.init();
        Meteor.drawingObject.init();
        Meteor.text.init();

        Meteor.startup(function () {
            $(document).on('keydown', function (event) {
                if (!Meteor.text.editId() && (event.ctrlKey || event.metaKey)) {

                    if (event.which && event.which === 37 || event.keyCode && event.keyCode === 37) {
                        //cursor left
                        event.preventDefault();
                        event.stopPropagation();
                        Meteor.drawingObject.alignLeft();
                    } else if (event.which && event.which === 39 || event.keyCode && event.keyCode === 39) {
                        //cursor right
                        event.preventDefault();
                        event.stopPropagation();
                        Meteor.drawingObject.alignRight();
                    } else if (event.which && event.which === 38 || event.keyCode && event.keyCode === 38) {
                        //cursor top
                        event.preventDefault();
                        event.stopPropagation();
                        Meteor.drawingObject.alignTop();
                    } else if (event.which && event.which === 40 || event.keyCode && event.keyCode === 40) {
                        //cursor bottom
                        event.preventDefault();
                        event.stopPropagation();
                        Meteor.drawingObject.alignBottom();
                    }

                }
            });
        });

        Meteor.spitfire.setInitialized();
    }

};