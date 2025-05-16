(function(_, angular, Cyberhawk) {
  var app = angular.module("menu/controller", [
    "cyberhawk/builder"
  ]);

  var Methods = {
    login: function() {
      this.logged = true;
      this.request();
    },
    logoff: function() {
      this.logged = false;
      this.request();
    }
  }

  var options = {
    routeParams: {},
    path: '/user/categories',
    route: '/user/categories',
    callback: function(){
      _.extend(this, Methods);
      _.bindAll(this, "login", "logoff");
      this.notifier.register("login-success", this.login);
      this.notifier.register("logged", this.login);
      this.notifier.register("logoff-success", this.logoff);
    }
  };

  app.controller("Menu.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular, window.Cyberhawk));
