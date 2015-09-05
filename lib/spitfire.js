DrawingObjects = new Mongo.Collection('DrawingObjects');
var GRID_PARAM_ID = ',grid:';

function initHelpers() {
    Handlebars.registerHelper('appTitle', function () {
        return Meteor.spitfire.appTitle();
    });

    Handlebars.registerHelper('sessionName', function () {
        return Meteor.spitfire.getSessionName();
    });

    Handlebars.registerHelper('hasSessionName', function () {
        return Meteor.spitfire.hasSessionName();
    });

    Handlebars.registerHelper('isInitialized', function () {
        return Meteor.spitfire.isInitialized();
    });
}

function parseGrid(url) {

    var grid = {x: null, y: null};
    if (url) {
        var start = url.toLowerCase().indexOf(GRID_PARAM_ID);
        if (start > 0) {
            var gridstring = url.toLowerCase().substring(start + GRID_PARAM_ID.length);
            var end = gridstring.indexOf(',');
            if (end > 0) {
                gridstring = gridstring.substring(0, end);
            }
            var x = gridstring.indexOf('x');
            if (x < 0) {
                var xparse = parseInt(gridstring);
                if (!isNaN(xparse)) {
                    grid.x = xparse;
                }
            } else {
                var xgrid = gridstring.substring(0, x);
                var xparse = parseInt(xgrid);
                if (!isNaN(xparse)) {
                    grid.x = xparse;
                }
                var ygrid = gridstring.substring(x + 1);
                var yparse = parseInt(ygrid);
                if (!isNaN(yparse)) {
                    grid.y = yparse;
                }
            }
        }

    }

    return grid;
}

function initRouter() {
    Router.route('/', 'editor');
    Router.route('/about');
    Router.route('/:sessionName/:any1?/:any2?/:any3?', function () {
        //:any parameters are only to deal with the failure case of additional slashes in session name
        var grid = parseGrid(this.params.sessionName);
        Meteor.grid.setGrid(grid);

        var sessionName = this.params.sessionName;
        var paramIdx = sessionName.indexOf(',');
        if (paramIdx > 0) {
            sessionName = sessionName.substring(0, paramIdx);
        }
        Meteor.spitfire.setSessionName(sessionName);
        Router.go('/' + this.params.sessionName);
        this.render('editor');
    });
}


Meteor.spitfire = {

    hasSessionName: function () {
        return Meteor.spitfire.getSessionName() ? true : false;
    },
    getSessionName: function () {
        return Session.get('sessionName');
    },
    setSessionName: function (sessionName) {
        Meteor.subscribe('drawingObjects', sessionName);
        Session.set('sessionName', sessionName); //reactivity needed
        document.title = Meteor.spitfire.documentTitle();
    },
    escapeRegEx: function (s) {
        return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
            return Meteor.spitfire.getSessionName();
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


    init: function () {
        Meteor.methods({
                initEditing: function (data) {
                    var now = new Date();
                    var insert = {
                        initId: data.initId,
                        sessionName: data.sessionName,
                        editing: now,
                        modifiedAt: now,
                        createdAt: now
                    };
                    Meteor.spitfire.preparePosition(data, insert);
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
                },
                cleanUp: function (data) {
                    if (data.text == null || data.text == '') {
                        return DrawingObjects.remove(data.id);
                    } else {
                        var cleanup = {
                            modifiedAt: new Date()
                        };
                        Meteor.spitfire.prepareEditing(data, cleanup);
                        Meteor.spitfire.prepareDragging(data, cleanup);
                        Meteor.spitfire.prepareSizing(data, cleanup);
                        return DrawingObjects.update(data.id, {
                            $set: cleanup
                        });
                    }
                },
                remove: function (id) {
                    DrawingObjects.remove(id);
                },
                updatePosition: function (data) {
                    var update = {
                        initId: null,
                        dragging: data.dragging,
                        modifiedAt: new Date()
                    };
                    Meteor.spitfire.preparePosition(data, update);
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
        Meteor.filter.init();
        Meteor.canvas.init();
        Meteor.grid.init();
        Meteor.drawingObject.init();
        Meteor.text.init();


        Meteor.startup(function () {
            $(document).on('keydown', function (event) {
                if (Meteor.select.isSelected() && (event.ctrlKey || event.metaKey)) {

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