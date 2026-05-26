(function(_, angular, noop) {
  var app = angular.module("home/controller", [
    "cyberhawk/builder"
  ]);

  var options = {
    path: '/categories',
    callback: noop
  };

  app.controller("Home.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular, window.noop));
