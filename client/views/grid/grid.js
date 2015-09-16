var GRID_PARAM_ID = ',grid:';
var MIN_GRID = 10;
var GRID_INDENT = 8; //same indentation as header


Meteor.grid = {
    hasGrid: function () {
        var grid = Meteor.grid.getGrid();
        return grid && (grid.x || grid.y);
    },
    getGridParamId: function () {
        return GRID_PARAM_ID;
    },
    getMinGrid: function () {
        return MIN_GRID;
    },
    snapLeft: function (left) {
        var grid = Meteor.grid.getGrid();
        if (!isNaN(left) && grid.x && grid.x > 0) {
            var factor = Math.floor(Math.max(left, 0) / grid.x);
            var rem = left % grid.x;
            var above = grid.x - rem;
            return (rem > above ? (factor + 1) * grid.x : factor * grid.x) + GRID_INDENT;
        }
        return left;
    },
    snapTop: function (top) {
        var grid = Meteor.grid.getGrid();
        if (!isNaN(top) && grid.y && grid.y > 0) {
            var factor = Math.floor(Math.max(top, 0) / grid.y);
            var rem = top % grid.y;
            var above = grid.y - rem;
            return (rem > above ? (factor + 1) * grid.y : factor * grid.y) + GRID_INDENT;

        }
        return top;
    },
    parseGrid: function (url) {

        var grid = {x: null, y: null};
        if (url) {
            var start = url.toLowerCase().indexOf(GRID_PARAM_ID);
            if (start >= 0) {
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
    },
    getGridString: function () {
        var gridstring = '';
        if (Meteor.grid.hasGrid()) {
            var grid = Meteor.grid.getGrid();
            gridstring = GRID_PARAM_ID;
            if (grid.x) {
                gridstring = gridstring + grid.x;
            }
            if (grid.y) {
                gridstring = gridstring + 'x' + grid.y;
            }
        }
        return gridstring;
    },
    getGrid: function () {
        return Session.get('grid');
    },
    setGrid: function (grid) {
        Session.set('grid', grid);
    },
    setXGrid: function (x) {
        var grid = Meteor.grid.getGrid();
        if (x && x > 0) {
            grid.x = x;
        } else {
            grid.x = null;
        }
        Meteor.grid.setGrid(grid);
    },
    setYGrid: function (y) {
        var grid = Meteor.grid.getGrid();
        if (y && y > 0) {
            grid.y = y;
        } else {
            grid.y = null;
        }
        Meteor.grid.setGrid(grid);
    },
    drawGrid: function () {
        var grid = Meteor.grid.getGrid();
        if (grid) {
            var eWidth = Meteor.editor.getWidth();
            var eHeight = Meteor.editor.getHeight();

            if (grid.x >= MIN_GRID) {
                var col = GRID_INDENT;
                while (col < eWidth) {
                    $('#canvas').append('<div class="grid-indicator" style="position:absolute;left:' + col + 'px;top:0;height:' + eHeight + 'px;border-left:1px dashed lightgray;"></div>');
                    col = col + grid.x;
                }
            }
            if (grid.y >= MIN_GRID) {
                var row = GRID_INDENT;
                while (row < eHeight) {
                    $('#canvas').append('<div class="grid-indicator" style="position:absolute;left:0;top:' + row + 'px;width:' + eWidth + 'px;border-top:1px dashed lightgray;"></div>');
                    row = row + grid.y;
                }
            }
        }

    },
    clearGrid: function () {
        $('.grid-indicator').remove();
    },
    maintainGrid: function () {
        Meteor.grid.clearGrid();
        Meteor.grid.drawGrid();
    }


};

(function () {


    $(window).on('resize', function () {
        Meteor.grid.maintainGrid();
    });

    Template.grid.events({
            'keypress': function (event) {
                if (event.which && event.which === 13 || event.keyCode && event.keyCode === 13) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.blur();
                }
            },
            'keyup #xgrid': function (event) {
                var x = parseInt(event.target.value);
                Meteor.grid.setXGrid(x);
            },
            'keyup #ygrid': function (event) {
                var y = parseInt(event.target.value);
                Meteor.grid.setYGrid(y);
            }
        }
    );

    Template.grid.rendered = function () {
        var xgrid = $('#xgrid');
        var ygrid = $('#ygrid');
        var grid = Meteor.grid.getGrid();
        xgrid.val(grid.x);
        ygrid.val(grid.y);

    };

})();