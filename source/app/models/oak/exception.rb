# frozen_string_literal: true

class Oak::Exception < StandardError
  class LoginFailed  < Oak::Exception; end
  class Unauthorized < Oak::Exception; end
  class NotLogged    < Oak::Exception; end
end
