(function(_, angular) {
  var app = angular.module("category/form_controller", [
    "cyberhawk/builder",
    "kind/methods"
  ]);

  var options = {
    callback: function() {
    }
  };

  app.controller("Category.FormController", [
    "cyberhawk_builder",
    "kinds_methods",
    function(builder, kindsMethods) {
      builder.buildAndRequest(this, options);
      kindsMethods.build(this);
    }
  ]);
}(window._, window.angular));
