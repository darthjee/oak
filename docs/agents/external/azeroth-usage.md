# Azeroth Gem Usage Instructions

This guide explains how to use the [Azeroth](https://github.com/darthjee/azeroth) gem in a Rails application. It is designed to be copied into other projects (e.g. as `docs/agents/external/azeroth-usage.md`) for AI coding agents to reference.

The links below are relative paths into the [`azeroth/`](azeroth/) folder next to this file — copy that folder alongside this one to keep them working, since this guide may be copied into projects that don't have the rest of Azeroth's own docs tree.

## About Azeroth

Azeroth is a Ruby gem that simplifies the creation of Rails controller endpoints. Its main feature is the `resource_for` class method, which automatically generates controller action methods (`create`, `show`, `index`, `update`, `destroy`, `edit`, `new`) and handles both HTML and JSON request formats transparently.

- HTML requests render templates without performing database operations.
- JSON requests perform database operations and return serialized JSON.

## Guide Contents

- [Installation](azeroth/installation.md)
- [Basic Usage](azeroth/basic-usage.md) — setting up `resource_for`, available actions, nested resources
- [`resource_for` Options](azeroth/resource-for-options.md) — options table, callbacks, pagination
- [Decorators](azeroth/decorators.md) — JSON serialization with `Azeroth::Decorator`
- [`model_for`](azeroth/model-for.md)
- [Best Practices](azeroth/best-practices.md)
- [Testing](azeroth/testing.md)

## Further Reading

- [Azeroth on RubyGems](https://rubygems.org/gems/azeroth)
- [YARD Documentation](https://www.rubydoc.info/gems/azeroth)
- [GitHub Repository](https://github.com/darthjee/azeroth)
