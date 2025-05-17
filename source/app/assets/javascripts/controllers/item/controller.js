(function(_, angular, Cyberhawk) {
  var app = angular.module("item/controller", [
    "cyberhawk/builder"
  ]);

  var Methods = {
  }

  var options = {
    routeParams: {},
    callback: function(){
      _.extend(this, Methods);
    }
  };

  app.controller("Item.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular, window.Cyberhawk));
