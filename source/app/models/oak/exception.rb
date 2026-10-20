# frozen_string_literal: true

module Oak
  class Exception < StandardError
    class LoginFailed      < Oak::Exception; end
    class Unauthorized     < Oak::Exception; end
    class NotLogged        < Oak::Exception; end
    class InvalidParameter < Oak::Exception; end
    class TooManyRequests  < Oak::Exception; end
  end
end
