(function(_, angular, Cyberhawk) {
  var app = angular.module("menu/controller", [
    "cyberhawk/builder"
  ]);

  var options = {
    routeParams: {},
    path: '/user/categories',
    route: '/user/categories',
    callback: function(){
      this.notifier.register("login-success", this.request)
    }
  };

  app.controller("Menu.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular, window.Cyberhawk));
