(function(_, angular) {
  var app = angular.module("item/form_controller", [
    "cyberhawk/builder"
  ]);

  var LinksMethods = {
    bindLinksTriggers: function() {
      this.constructor.on(this.route, "loaded", this.initLinks);
    },

    initLinks: function() {
      if (this.data) {
        if (!this.data.links) {
          this.data.links = [{}];
        }
        if (!this.data.links[0]) {
          this.data.links = [{}];
        }
      }
    },

    addLink: function() {
      this.data.links.push({});
    },

    removeLink: function(index) {
      this.data.links.splice(index, 1);
    },
  };

  var options = {
    callback: function(){
      _.extend(this, LinksMethods);
      _.bindAll(this, "bindLinksTriggers", "initLinks", "addLink", "removeLink");

      this.bindLinksTriggers();
    }
  };

  app.controller("Item.FormController", [
    "cyberhawk_builder",
    "kinds_methods",
    function(builder, kindsMethods) {
      builder.buildAndRequest(this, options);
      kindsMethods.build(this);
    }
  ]);
}(window._, window.angular));
