var grid = {x: null, y: null};

Meteor.grid = {
    snapLeft: function (left) {
        if (left && grid.x && grid.x > 0) {
            var factor = Math.floor(left / grid.x);
            var rem = left % grid.x;
            var above = grid.x - rem;
            return (rem > above ? (factor + 1) * grid.x : factor * grid.x) + 1;
        }
        return left;
    },
    snapTop: function (top) {
        if (top && grid.y && grid.y > 0) {
            var factor = Math.floor(top / grid.y);
            var rem = top % grid.y;
            var above = grid.y - rem;
            return (rem > above ? (factor + 1) * grid.y : factor * grid.y) + 1;

        }
        return top;
    },
    setXGrid: function (x) {
        if (x && x > 0) {
            grid.x = x;
        } else {
            grid.x = null;
        }
    },
    setYGrid: function (y) {
        if (y && y > 0) {
            grid.y = y;
        } else {
            grid.y = null;
        }
    },

    init: function () {

        Template.grid.events({
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
            xgrid.val(grid.x);
            ygrid.val(grid.y);

        };
    }
};