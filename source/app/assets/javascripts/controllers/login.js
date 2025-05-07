(function(_, angular, $) {
  var app = angular.module('login/controller', [
    'cyberhawk/controller',
    'cyberhawk/notifier',
    'binded_http'
  ]);

  function Controller(bindedHttp, notifier) {
    this.http     = bindedHttp.bind(this);
    this.notifier = notifier;

    _.bindAll(this, "submit", "clear", "finishRequest", "_success", "_error");
  }

  var fn = Controller.prototype;

  fn.submit = function() {
    this.clear();

    this._request()
      .success(this._success)
      .error(this._error);
  };

  fn.clear = function() {
   this.incorrect = false;
   this.error = false;
  };

  fn._request = function() {
    return this.http.post('/users/login', {
      login: {
        login: this.login,
        password: this.password
      }
    });
  };

  fn._success = function(user) {
    this.notifier.notify("login-success", user);
    this.password = null;

    $("#loginModal").modal("hide");
  };

  fn._error = function(_body, status) {
    this.password = null;

    this.notifier.notify("login-errror", {
      status
    });

    if (status / 100 == 4) {
      this.incorrect = true
    } else {
      this.error = true
    }
  };

  fn.initRequest = function() {
    this.ongoing = true;
  };

  fn.finishRequest = function() {
    this.ongoing = false;
  };

  app.controller('Login.Controller', [
    'binded_http',
    'cyberhawk_notifier',
    Controller
  ]);
}(window._, window.angular, window.$));

