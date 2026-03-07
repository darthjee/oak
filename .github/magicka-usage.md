# Magicka Gem Usage Instructions

This file provides guidance for GitHub Copilot when working in projects that use the [Magicka](https://github.com/darthjee/magicka) gem.

## About Magicka

Magicka is a Ruby gem that renders AngularJS-compatible form elements and display elements inside ERB templates. It abstracts the repetitive HTML for inputs, selects, textareas, and display fields, binding them to AngularJS `ng-model` expressions and surfacing validation errors automatically.

Magicka provides two main helpers:

- **`magicka_form(model)`** – yields a form builder; elements rendered inside use AngularJS two-way binding and show validation errors.
- **`magicka_display(model)`** – yields a display builder; elements rendered inside are read-only.

Both helpers use `form.only(:form)` / `form.only(:display)` to conditionally show blocks depending on whether the context is a form or a display view.

## Basic Usage

### Form View (`new.html.erb` / `edit.html.erb`)

```erb
<div>
  <% magicka_form('gnc.data') do |form| %>
    <%= render partial: 'form', locals: { form: form, title: "New Category" } %>
  <% end %>
</div>
```

### Display View (`show.html.erb`)

```erb
<div>
  <% magicka_display('gnc.data') do |display| %>
    <%= render partial: 'form', locals: { form: display, title: "Category Details" } %>
  <% end %>
</div>
```

### Shared Form Partial (`_form.html.erb`)

The form and display views typically share a single `_form.html.erb` partial. Use `form.only(:form)` and `form.only(:display)` to conditionally render elements based on the current context:

```erb
<%# Shown only when displaying (show view) %>
<%= form.only(:display) do
  angular_safe_link_to(:edit_category, { slug: "{{gnc.data.slug}}" },
    class: 'btn btn-primary', "ng-show" => "gnc.global_state.logged") { 'Edit' }
end %>

<div class="card shadow-sm">
  <div class="card-header bg-primary text-white">
    <h4 class="my-0 font-weight-normal">
      <%# Show different titles for form vs display %>
      <%= form.only(:form) { "Edit Category" } || "Category Details" %>
    </h4>
  </div>
  <div class="card-body">
    <div class="form-group">
      <%= form.input(:name, placeholder: "Category name", class: "form-control form-control-lg") %>
    </div>

    <%# Save button — shown only in form context %>
    <div class="form-group row mt-4">
      <div class="col-12 text-center">
        <%= form.only(:form) do
          form.button(
            ng_click: 'gnc.save()',
            ng_disabled: 'gnc.ongoing',
            classes: 'btn btn-success btn-lg',
            text: 'Save'
          )
        end %>
      </div>
    </div>
  </div>
</div>
```

## Built-in Elements

### `form.input(field, options = {})`

Renders a text input bound to `ng-model` with error display support.

```erb
<%= form.input(:name, placeholder: "Item name", class: "form-control") %>
<%= form.input(:name, label: "Full Name", placeholder: "Enter name") %>
```

Template used: `templates/forms/_input.html.erb`

### `form.textarea(field, options = {})`

Renders a `<textarea>` bound to `ng-model`.

```erb
<%= form.textarea(:description, placeholder: "Description", class: "form-control") %>
```

Template used: `templates/forms/_ng_textarea.erb`

### `form.select(field, options = {})`

Renders a standard `<select>` dropdown.

```erb
<%= form.select(:status, options: statuses) %>
```

Template used: `templates/forms/_select.html.erb`

### `form.ng_select(field, options = {})`

Renders an AngularJS-powered `<select>` that iterates over a dynamic list from the AngularJS scope and displays validation errors.

```erb
<%= form.ng_select(
  :kind_slug,
  options: "gnc.kinds",
  reference_key: :slug,
  text_field: :name,
  ng_errors: "gnc.data.errors.kind",
  class: "form-control"
) %>
```

Template used: `templates/forms/_ng_select.html.erb`

### `display.text(field, options = {})`

Renders a read-only plain text display for a field value bound to `ng-model`.

```erb
<%= display.text(:name, label: "Name") %>
```

Template used: `templates/display/_text.erb`

### `display.ng_select_text(field, options = {})`

Renders a read-only display that resolves a reference key from a list and shows the corresponding text.

```erb
<%= display.ng_select_text(
  :kind_slug,
  options: "gnc.kinds",
  reference_key: :slug,
  text_field: :name
) %>
```

Template used: `templates/display/_ng_select_text.html.erb`

### `display.pagination(field, options = {})`

Renders AngularJS-powered pagination controls.

```erb
<%= magicka_display('gnc') do |display|
  display.pagination(
    'pagination',
    path_method: :category_items,
    options: { category_slug: '{{gnc.category.slug}}' }
  )
end %>
```

Template used: `templates/display/_ng_pagination.html.erb`

### `form.button(options = {})`

Renders a submit button with AngularJS bindings.

```erb
<%= form.button(
  ng_click: 'gnc.save()',
  ng_disabled: 'gnc.ongoing',
  classes: 'btn btn-success btn-lg',
  text: 'Save'
) %>
```

Template used: `templates/forms/_button.html.erb`

## Conditional Rendering with `form.only`

Use `form.only(:form)` to render content only in form context (new/edit), and `form.only(:display)` for display-only context (show).

```erb
<%# Only shown in edit/new forms %>
<%= form.only(:form) do
  form.ng_select(:kind_slug, options: "gnc.kinds", reference_key: :slug, text_field: :name)
end %>

<%# Only shown in show view %>
<%= form.only(:display) do
  form.input("kind.name", label: "Kind", class: "form-control-plaintext")
end %>
```

## Creating a New Magicka Element

When the built-in Magicka elements are not sufficient, you can create a custom element.

### 1. Create the Element Model

Create a file in `app/models/magicka/` that extends an existing Magicka base class:

```ruby
# app/models/magicka/ng_rating.rb
module Magicka
  class NgRating < Magicka::Input
    with_attribute_locals :max_stars

    def max_stars
      @max_stars ||= 5
    end
  end
end
```

Available base classes:
- `Magicka::Element` – bare element; no built-in locals
- `Magicka::Input` – adds `field`, `label`, `ng_model`, `placeholder`, `ng_errors`
- `Magicka::Select` – adds `field`, `label`, `ng_model`, `options`, `ng_errors`
- `Magicka::Text` – display text element with `field`, `label`, `ng_model`

Use `with_attribute_locals :attr_name` to declare additional template locals with a configurable default (falls back to `nil` unless overridden).

### 2. Create the ERB Template

Create the corresponding partial in `app/views/templates/forms/` (for form elements) or `app/views/templates/display/` (for display elements). The template name should be an underscore-prefixed snake-case version of the class name:

```erb
<%# app/views/templates/forms/_ng_rating.html.erb %>
<div class="form-group row align-items-center">
  <label for="<%= field %>" class="col-4 col-form-label text-right"><%= label %></label>
  <div class="col-8">
    <span ng-repeat="star in [] | range:<%= max_stars %>">
      <i class="fa fa-star" ng-class="{'text-warning': <%= ng_model %> > $index}"
         ng-click="<%= ng_model %> = $index + 1"></i>
    </span>
    <div class="invalid-feedback d-block mt-1" ng-repeat="error in <%= ng_errors %>">
      {{error}}
    </div>
  </div>
</div>
```

### 3. Register the Template Folder (if using a custom folder)

If the template does not live in the default Magicka template folder, specify the folder in the model:

```ruby
module Magicka
  class NgRating < Magicka::Input
    template_folder 'templates/forms'
  end
end
```

### 4. Use the New Element in Views

Once the model and template exist, the element is available on the form builder automatically:

```erb
<%= form.ng_rating(:rating, label: "Rating", max_stars: 5) %>
```

## Best Practices

- **Always use `form.only(:form)` / `form.only(:display)`** to show different content in form vs display contexts rather than duplicating the partial.
- **Place form-context fields in a shared `_form.html.erb` partial** shared by `new`, `edit`, and `show` views.
- **Use `ng_errors`** for fields that are validated on the server to surface errors next to the field.
- **Use `ng_select` for foreign key fields** to let users pick from a list loaded in the AngularJS scope.
- **Prefer built-in elements** before creating a custom one.
- **Create custom elements** only when the built-in elements do not cover the use case (e.g., star ratings, rich text editors, file pickers).
