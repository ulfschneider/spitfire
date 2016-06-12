// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by tinycolorpick.js.
import { name as packageName } from "meteor/tinycolorpick";

// Write your tests here!
// Here is an example.
Tinytest.add('tinycolorpick - example', function (test) {
  test.equal(packageName, "tinycolorpick");
});
