# Issue: Use React Front-End

## Description

The frontend is currently served directly by the Rails application using AngularJS. The goal is to extract the frontend into a standalone React application built with Vite, located in a separate `frontend` folder. The existing proxy (tent) will be responsible for serving the built HTML and assets. The visual appearance and navigation of the application should remain unchanged.

## Problem

- The frontend is tightly coupled to the Rails app, making independent development and deployment difficult.
- AngularJS is a legacy framework; migrating to React modernizes the stack.

## Expected Behavior

- A `frontend/` directory exists at the project root containing a React + Vite application.
- The proxy (tent) serves the compiled frontend assets instead of Rails.
- The application looks and navigates the same as the current AngularJS version.

## Solution

- Create a `frontend/` folder with a React + Vite project setup.
- Reimplement the current AngularJS views and navigation in React, preserving the same routes and UI.
- Configure tent to proxy requests to the Vite-built assets.
- Remove or disable the AngularJS frontend from the Rails app once the React version is complete.

## Benefits

- Decouples frontend from the Rails monolith, enabling independent development workflows.
- Modernizes the tech stack by replacing legacy AngularJS with React.
- Improves build tooling with Vite (fast HMR, optimized production builds).

---
See issue for details: https://github.com/darthjee/oak/issues/92
