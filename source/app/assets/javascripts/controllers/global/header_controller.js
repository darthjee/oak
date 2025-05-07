(function(_, angular, Global) {
  var app = angular.module('global/header_controller', [
    'cyberhawk/notifier',
    'binded_http'
  ]);

  function Controller(http, notifier, timeout) {
    this.http = http.bind(this);
    this.notifier = notifier;
    this.timeout = timeout;

    _.bindAll(this, 'finishRequest', '_login', '_completeLogoff');
    this._listen();
    this._checkLogin();
  }

  var fn = Controller.prototype;

  fn.logoff = function() {
    this.http
      .delete('/users/logoff')
      .success(this._completeLogoff);
  };

  fn._listen = function() {
    this.notifier.register('login-success', this._login);
  };

  fn._checkLogin = function() {
    this.http.get('/users/login.json').success(this._login);
  };

  fn._completeLogoff = function() {
    this.user = null;
    this.logged = false;
  };

  fn._login = function(user) {
    var that = this;

    this.timeout(function() {
      that.user = user;
      that.logged = true;
    }, 1);
  };

  fn.initRequest = function() {
    this.ongoing = true;
  };

  fn.finishRequest = function() {
    this.ongoing = false;
  };

  app.controller('Global.HeaderController', [
    'binded_http', 'cyberhawk_notifier', '$timeout',
    Controller
  ]);

  Global.Controller = Controller;
}(window._, window.angular, window.Global));


