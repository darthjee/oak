(function(_, angular) {
  var app = angular.module("item/form_controller", [
    "cyberhawk/builder"
  ]);

  var KindMethods = {
    requestKinds: function() {
      var promise = this._getKindsRequester().request();
      promise.then(this._setKinds);

      this.constructor.trigger(this, this.route, "request");
    },

    _setKinds: function(response) {
      this.kinds = response.data;
      this.loaded = true;
      this.constructor.trigger(this, this.route, "loaded");
    },

    _getKindsRequester: function() {
      if ( !this.kindsRequester ) {
        this._buildKindsRequester();
      }

      return this.kindsRequester;
    },
    _buildKindsRequester: function() {
      this.kindsRequester = this.requesterBuilder.build({
        search: this.location.$$search,
        path: "/kinds"
      });
      this.kindsRequester.bind(this);
    }
  };

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
      };
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
      _.extend(this, KindMethods);
      _.extend(this, LinksMethods);
      _.bindAll(this, "requestKinds", "_setKinds", "_getKindsRequester", "_buildKindsRequester");
      _.bindAll(this, "bindLinksTriggers", "initLinks", "addLink", "removeLink");

      this.requestKinds();
      this.bindLinksTriggers();
    }
  };

  app.controller("Item.FormController", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));
