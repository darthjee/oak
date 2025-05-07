(function(_, angular, Cyberhawk) {
  var app = angular.module("home/controller", [
    "cyberhawk/builder"
  ]);

  app.controller("Home.Controller", [
    "cyberhawk_builder", function(builder) { builder.build(this); }
  ]);
}(window._, window.angular, window.Cyberhawk));
