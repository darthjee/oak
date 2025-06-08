(function(_, angular) {
  var module = angular.module("kind/methods", []);

  var KindMethods = {
    requestKinds: function() {
      var promise = this._getKindsRequester().request();
      promise.then(this._setKinds);

      this.constructor.trigger(this, this.route, "request");
    },

    _setKinds: function(response) {
      this.kinds = response.data;
      this.loaded = true;
      this.constructor.trigger(this, this.route, "loaded");
    },

    _getKindsRequester: function() {
      if ( !this.kindsRequester ) {
        this._buildKindsRequester();
      }

      return this.kindsRequester;
    },
    _buildKindsRequester: function() {
      this.kindsRequester = this.requesterBuilder.build({
        search: this.location.$$search,
        path: this._kindsPath()
      });
      this.kindsRequester.bind(this);
    },
    _kindsPath: function() {
      var category_slug = this.routeParams.category_slug;

      if (this.route.match("/categories/:category_slug/items/")) {
        return "/categories/" + category_slug + "/kinds";
      } else {
        return "/kinds";
      }
    }
  };

  class MethodsFactoryBuilder {
    build(controller) {
        _.extend(controller, KindMethods);
        _.bindAll(controller, "requestKinds", "_setKinds", "_getKindsRequester", "_buildKindsRequester");

        controller.requestKinds();
    }
  }

  function MethodsFactory() {
    return new MethodsFactoryBuilder();
  }

  module.service("kinds_methods", [
    MethodsFactory
  ]);
}(window._, window.angular));

