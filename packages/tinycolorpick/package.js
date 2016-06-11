Package.describe({
  name: "us:tinycolorpick",
  version: "1.0.0",
  summary: "A wrapper package for http://rachel-carvalho.github.io/simple-color-picker/",
  git: "",
  documentation: "README.md"
});

Package.onUse(function(api) {
  api.versionsFrom("1.3.2.4");
  api.use(["ecmascript", "templating", "jquery"]);
	
  api.addFiles([
     "simple-color-picker.js",
     "simple-color-picker.css",
     "tinyColorPick.html",
      "tinyColorPick.js"
   ], ["client"]);

    api.export(["tinyColorPick"], ["client", "server"]);
});


Package.onTest(function(api) {
  api.use(["ecmascript", "templating", "jquery"]);
  api.use("tinytest");
  api.use("us:tinycolorpick");
  api.mainModule("tinyColorPick-tests.js");
});
