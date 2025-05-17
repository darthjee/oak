(function(_, angular, Cyberhawk) {
  var app = angular.module("item/controller", [
    "cyberhawk/builder"
  ]);

  var Methods = {
    requestKinds: function() {
      var promise = this._getKindsRequester().request();
      promise.then(this._setData);

      this.constructor.trigger(this, this.route, "request");
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
  }

  var options = {
    callback: function(){
      _.extend(this, Methods);
      this.requestKinds();
    }
  };

  app.controller("Item.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);

    }
  ]);
}(window._, window.angular, window.Cyberhawk));
