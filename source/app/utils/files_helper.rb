# frozen_string_literal: true

module FilesHelper
  extend self

  def directories_in(path)
    return [] unless Dir.exist?(path)

    Dir.entries(path).select do |entry|
      full_path = File.join(path, entry)
      File.directory?(full_path) && !['.', '..'].include?(entry)
    end
  end

  def files_in(path)
    return [] unless Dir.exist?(path)

    Dir.entries(path).select do |entry|
      full_path = File.join(path, entry)
      File.file?(full_path)
    end
  end
end