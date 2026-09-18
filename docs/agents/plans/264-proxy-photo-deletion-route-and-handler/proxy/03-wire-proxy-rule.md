# Wire the DELETE proxy rule

Add a Tent rule that routes `DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id`
to `PhotoDeleteRequestHandler`, following `uploads.php`'s
`Configuration::buildRule()` shape.

Add it as a new `docker_volumes/proxy_configuration/rules/deletes.php`
rather than extending `uploads.php` — `uploads.php` is scoped to the
Submit step (its own docblock says so) and each rule file maps to one
handler/one concern in this proxy, so a same-named-but-different-method
rule keeps that one-rule-per-concern convention rather than overloading
Submit's file.

```php
Configuration::buildRule([
    'handler' => [
        'class'      => 'Oak\Proxy\PhotoDeleteRequestHandler',
        'host'       => 'http://backend:3000',
        'photosPath' => '/tmp/photos'
    ],
    'matchers' => [
        [
            'method'  => 'DELETE',
            'pattern' => '#^/uploads/categories/[^/]+/items/\d+/photos/\d+/?$#',
            'type'    => 'regex'
        ]
    ]
]);
```

Confirm the regex doesn't accidentally also match the existing Submit
path (`/uploads/.../photos/:id/submit`) — it shouldn't, since Submit uses
`POST` and this rule is `DELETE`-only, but double check Tent's rule
matching doesn't fall through unexpectedly when both files are loaded
together.

## Files to Change

- `docker_volumes/proxy_configuration/rules/deletes.php` (new) — routes
  the `DELETE` path to `PhotoDeleteRequestHandler`.
