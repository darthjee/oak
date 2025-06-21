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

  def files_in(path, extension: nil)
    return [] unless Dir.exist?(path)

    Dir.entries(path).select do |entry|
      full_path = File.join(path, entry)
      File.file?(full_path) && matches_extension?(entry, extension)
    end
  end

  private

  def matches_extension?(file_name, extensions)
    return true if extensions.nil?
    extensions = Array(extensions)
    return true if extensions.empty?

    extensions.any? do |extension|
      File.extname(file_name).casecmp(".#{extension}").zero?
    end
  end
end