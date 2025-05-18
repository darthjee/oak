(function(_, angular) {
  var app = angular.module("global/generic_controller", [
    "cyberhawk/builder"
  ]);

  var options = {
    callback: function(){
    }
  };

  app.controller('Global.GenericController', [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));  
