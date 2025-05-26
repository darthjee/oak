(function(_, angular) {
  var app = angular.module("item/index_controller", [
    "cyberhawk/builder"
  ]);

  var options = {
    callback: function(){
    }
  };

  app.controller("Item.IndexController", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));
