# Request Flow

## Navigation Pattern

1. **Initial access**: User accesses any route (e.g., `/categories`)
2. **Redirection**: Tarquinn + OnePageApplication concern redirect to root with anchor (e.g., `/#/categories`)
3. **SPA Navigation**: All subsequent navigation happens via anchors, without page reload

## Content Loading (AngularJS + Cyberhawk)

When the user navigates to a section:

1. **HTML Template**: Requests the template via AJAX (e.g., `/categories.html?ajax=true`)
2. **JSON Data**: Requests the data via API (e.g., `/categories.json`)
3. **Rendering**: AngularJS combines template + data to build the page

**Complete flow example:**
```
User accesses: /categories
       ↓
Redirected to: /#/categories
       ↓
Cyberhawk intercepts and makes:
  - GET /categories.html?ajax=true (template)
  - GET /categories.json (data)
       ↓
AngularJS renders the page
```
