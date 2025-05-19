(function(angular) {
  window.Home = {};

  angular.module("item", [
    "item/index_controller",
    "item/form_controller",
    "item/show_controller"
  ])
}(window.angular));

