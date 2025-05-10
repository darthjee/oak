(function(_, angular, Cyberhawk) {
  var app = angular.module("menu/controller", [
    "cyberhawk/builder"
  ]);

  var options = {
    routeParams: {},
    route: '/user/categories'
  };

  app.controller("Menu.Controller", [
    "cyberhawk_builder", function(builder) {
        builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular, window.Cyberhawk));
