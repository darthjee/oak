(function(_, angular) {
  var app = angular.module("item/index_controller", [
    "cyberhawk/builder"
  ]);

  var CategoryMethods = {
    requestCategory: function() {
      var promise = this._getCategoryRequester().request();
      promise.then(this._setCategory);

      this.constructor.trigger(this, this.route, "request");
    },

    _setCategory: function(response) {
      this.category = response.data;
      this.loaded = true;
      this.constructor.trigger(this, this.route, "loaded");
    },

    _getCategoryRequester: function() {
      if (!this.categoryRequester) {
        this._buildCategoryRequester();
      }

      return this.categoryRequester;
    },

    _buildCategoryRequester: function() {
      var path = this.location.$$url.replace(
        /\/categories\/([^/]*)\/items.*$/, "/categories/$1"
      );
      this.categoryRequester = this.requesterBuilder.build({
        search: this.location.$$search,
        path: path
      });
      this.categoryRequester.bind(this);
    }
  };

  var options = {
    callback: function(){
      _.extend(this, CategoryMethods);
      _.bindAll(this, "requestCategory", "_setCategory", "_getCategoryRequester", "_buildCategoryRequester");

      this.requestCategory();
    }
  };

  app.controller("Item.IndexController", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));
