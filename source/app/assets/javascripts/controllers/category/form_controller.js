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

    matchSlug(slug) {
      return function(kind) {
        return kind.slug == slug;
      }
    },

    selectedKind: function(kind) {
      var kind = _.find(this.kinds, this.matchSlug(this.data.kind_slug));

      return (!this.hasKind(kind)) && kind;
    },

    hasKind: function(kind) {
      if (!kind) {
        return true;
      }

      return _.any(this.data.kinds, this.matchSlug(this.data.kind_slug));
    },

    removeKind: function(kind) {
      this.data.kinds = _.reject(this.data.kinds, this.matchSlug(kind.slug));
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
