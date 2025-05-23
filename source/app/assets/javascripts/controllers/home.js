(function(_, angular) {
  var app = angular.module("home/controller", [
    "cyberhawk/builder"
  ]);

  var options = {
    path: '/categories',
    callback: function(){
    }
  };

  app.controller("Home.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));
