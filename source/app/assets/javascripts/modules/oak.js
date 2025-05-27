(function(angular) {
  var module = angular.module('oak', [
    'global',
    'cyberhawk',
    'johto',
    'home',
    'login',
    'menu',
    'category',
    'kind',
    'item'
  ]);

  module.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.patch = {
      'Content-Type': 'application/json;charset=utf-8'
    };
  }]);
}(window.angular));
