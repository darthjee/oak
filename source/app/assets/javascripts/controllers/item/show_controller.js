(function(_, angular) {
  var app = angular.module("item/show_controller", [
    "cyberhawk/builder"
  ]);

  var options = {};

  app.controller("Item.ShowController", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));