# Plan: Uniform photo layout for catalog cards on index pages

Issue: [409-uniform-photo-layout-for-catalog-cards-on-index-pages.md](../../issues/409-uniform-photo-layout-for-catalog-cards-on-index-pages.md)

## Overview
Give every catalog card on the categories, kinds and category items index pages the same square photo box. A new `CardPhoto` element built only from Bootstrap 5.3 utilities is added, and `CatalogCard` renders it on top of the card, outside `card-body`. The work is entirely in `frontend/`.

See [frontend.md](frontend.md) for the full plan.
