# frozen_string_literal: true

module FilesHelper
  extend self

  def directories_in(path)
    entries_in(path, :directory, ignored_entries: ['.', '..'])
  end

  def files_in(path, extension: nil)
    entries_in(path, :file, extension:)
  end

  private

  def entries_in(path, type, extension: nil, ignored_entries: nil)
    return [] unless Dir.exist?(path)

    Dir.entries(path).select do |entry|
      full_path = File.join(path, entry)
      entry_matches?(full_path, entry, type, extension:, ignored_entries:)
    end
  end

  def entry_matches?(full_path, entry, type, extension: nil, ignored_entries: nil)
    return unless File.public_send("#{type}?", full_path)
    return if ignored_entry?(entry, ignored_entries)
    matches_extension?(entry, extension)
  end

  def ignored_entry?(entry, ignored_entries = nil)
    return false unless ignored_entries
    ignored_entries.include?(entry)
  end

  def matches_extension?(file_name, extensions)
    return true if extensions.nil?
    extensions = Array(extensions)
    return true if extensions.empty?

    extensions.any? do |extension|
      File.extname(file_name).casecmp(".#{extension}").zero?
    end
  end
end