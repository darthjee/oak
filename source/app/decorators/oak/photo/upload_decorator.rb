# frozen_string_literal: true

module Oak
  class Photo
    # Response shape for the Init / status-gate (Finalize) endpoints.
    #
    # Unlike +Oak::Photo::Decorator+, this never exposes +photo_url+/
    # +snap_url+: at Init time the file doesn't exist on disk yet, so those
    # URLs would 404.
    class UploadDecorator < ModelDecorator
      expose :id
      expose :file_name
      expose :ready
    end
  end
end
