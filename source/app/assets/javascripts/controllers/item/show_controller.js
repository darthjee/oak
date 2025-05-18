(function(_, angular) {
  var app = angular.module("item/show_controller", [
    "cyberhawk/builder"
  ]);

  var PhotoMethods = {
    requestPhotos: function() {
      var promise = this._getPhotosRequester().request();
      promise.then(this._setPhotos);

      this.constructor.trigger(this, this.route, "request");
    },

    _setPhotos: function(response) {
      this.photos = response.data;
      this.loaded = true;
      this.constructor.trigger(this, this.route, "loaded");
    },

    _getPhotosRequester: function() {
      if (!this.photosRequester) {
        this._buildPhotosRequester();
      }

      return this.photosRequester;
    },

    _buildPhotosRequester: function() {
      this.photosRequester = this.requesterBuilder.build({
        search: this.location.$$search,
        path: "/photos"
      });
      this.photosRequester.bind(this);
    }
  };

  var options = {
    callback: function() {
      _.extend(this, PhotoMethods);
      _.bindAll(this, "requestPhotos", "_setPhotos", "_getPhotosRequester", "_buildPhotosRequester");

      this.requestPhotos();
    }
  };

  app.controller("Item.ShowController", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));