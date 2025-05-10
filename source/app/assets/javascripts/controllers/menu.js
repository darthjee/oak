(function(_, angular, Cyberhawk) {
  var app = angular.module("menu/controller", [
    "cyberhawk/builder"
  ]);

  app.controller("Menu.Controller", [
    "cyberhawk_builder", function(builder) { builder.build(this); }
  ]);
}(window._, window.angular, window.Cyberhawk));