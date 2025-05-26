(function(angular) {
  var module = angular.module("oak");

  module.config(["johtoProvider", function(provider) {
    provider.defaultConfig = {
      controller: "Global.GenericController",
      controllerAs: "gnc",
      templateBuilder: function(route, params) {
        return route + "?ajax=true";
      }
    }

    provider.configs = [{
      routes: ["/"],
      config: {
        controller: "Home.Controller",
        controllerAs: "gnc"
      }
    }, {
      routes: [
        "/categories/:category_slug/items/new",
        "/categories/:category_slug/items/:id/edit",
      ],
      config: {
        controller: "Item.FormController",
        controllerAs: "gnc"
      }
    }, {
      routes: [
        "/categories/:category_slug/items"
      ],
      config: {
        controller: "Item.IndexController",
        controllerAs: "gnc"
      }
    }, {
      routes: [
        "/categories/:category_slug/items/:id"
      ],
      config: {
        controller: "Item.ShowController",
        controllerAs: "gnc"
      }
    }, {
      routes: ["/admin/users/new", "/admin/users/:id", "/admin/users", "/admin/users/:id/edit"]
    }, {
      routes: ["/forbidden"]
    }, {
      controller: "Category.Controller",
      controllerAs: "gnc",
      routes: ["/categories", "/categories/new", "/categories/:category_slug"]
    }, {
      routes: ["/kinds", "/kinds/new", "/kinds/:kind_slug"]
    }];
    provider.$get().bindRoutes();
  }]);
}(window.angular));

