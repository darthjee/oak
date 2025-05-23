(function(_, angular) {
  var app = angular.module("home/controller", [
    "cyberhawk/builder"
  ]);

  var options = {
    callback: function(){
    }
  };

  app.controller("Home.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.build(this, options);
    }
  ]);
}(window._, window.angular));
