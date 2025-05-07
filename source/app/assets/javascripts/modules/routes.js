(function(angular) {
  var module = angular.module("sidewinder");

  module.config(["johtoProvider", function(provider) {
    provider.defaultConfig = {
      controller: "Cyberhawk.Controller",
      controllerAs: "gnc",
      templateBuilder: function(route, params) {
        return route + "?ajax=true";
      }
    }

    provider.configs = [{
      routes: ["/"],
      config: {
        controllerAs: "hc"
      }
    }, {
      routes: ["/admin/users/new", "/admin/users/:id", "/admin/users", "/admin/users/:id/edit"]
    }, {
      routes: ["/forbidden"]
    }];
    provider.$get().bindRoutes();
  }]);
}(window.angular));

