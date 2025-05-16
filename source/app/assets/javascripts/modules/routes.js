(function(angular) {
  var module = angular.module("oak");

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
    }, {
      routes: ["/categories", "/categories/new", "/categories/:category_slug"]
    }, {
      routes: ["/categories/:category_slug/items", "/categories/:category_slug/new"]
    }, {
    }];
    provider.$get().bindRoutes();
  }]);
}(window.angular));

