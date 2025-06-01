(function(_, angular) {
  var app = angular.module("category/form_controller", [
    "cyberhawk/builder",
    "kind/methods"
  ]);

  var KindsMethods = {
    addKind: function() {
      var kind = this.selectedKind();

      if (kind) {
        this.data.kinds.push(kind);
      }
    },

    selectedKind: function(kind) {
      var that = this;

      var kind = _.find(this.kinds, function(kind) {
        return kind.slug === that.data.kind_slug;
      });

      return (!this.hasKind(kind)) && kind;
    },

    hasKind: function(kind) {
      var that = this;

      if (!kind) {
        return true;
      }

      return _.any(this.data.kinds, function(kind) {
        return kind.slug === that.data.kind_slug;
      });
    },

    removeKind: function(kind) {
      var that = this;

      this.data.kinds = _.filter(this.data.kinds, function(k) {
        return k.slug != kind.slug;
      });
    }
  };

  var options = {
    callback: function() {
      _.extend(this, KindsMethods);
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
