# Oak

[![Build Status](https://circleci.com/gh/darthjee/oak.svg?style=shield)](https://circleci.com/gh/darthjee/oak)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/35480a5e82e74ff7a0186697b3f61a4b)](https://app.codacy.com/gh/darthjee/oak/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

![oak](https://raw.githubusercontent.com/darthjee/oak/master/oak.png)

**Current Version:** [1.5.1](https://github.com/darthjee/oak/releases/tag/1.5.1)

**Next Release:** [1.5.2](https://github.com/darthjee/oak/compare/1.5.1...main)

## About

Oak is a flexible cataloging application designed to help users organize and manage various types of collections, including:

- Projects
- Photos
- Paintings
- Electronic components
- And any other items that need cataloging

## Technology Stack

- **Ruby on Rails** — Main application framework
- **MySQL 9.3.0** — Relational database
- **Redis 6.2.4** — In-memory data store for background jobs
- **Sidekiq** — Background job processing
- **Docker & Docker Compose** — Containerization and orchestration

## Project Structure

Oak is a Rails monolithic application served with Docker. The main source code lives in the `source/` directory.

Key infrastructure components:

- The Rails app and frontend are served together (no separate frontend server)
- MySQL is used as the primary database
- Redis and Sidekiq handle background job processing
- A photo service is included for serving uploaded files

## Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### First Time Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/darthjee/oak.git
   cd oak
   ```

2. Run project setup (creates `.env` from `.env.example`, installs dependencies, and prepares the database):
   ```bash
   make setup
   ```

3. Review and adjust `.env` values if needed.

4. Start the development environment and enter the container shell:
   ```bash
   make dev
   ```

## Running the Application

The following `make` commands are available for development:

- **`make setup`** — First-time bootstrap command. Creates `.env` from `.env.example`, then runs setup inside the application container (`yarn install`, wait for DB, and `rake db:create db:migrate db:seed`).

- **`make dev`** — Starts the development environment and drops you into a shell inside the container. Useful for running commands, migrations, and general development tasks.

- **`make dev-up`** — Starts the application server, making it accessible in your browser at [http://localhost:3000](http://localhost:3000).

- **`make tests`** — Runs the test suite in an interactive shell.

## Additional Information

- The main application runs on port **3000**
- The photo service runs on port **3001**
- Environment variables are configured via the `.env` file (generated from `.env.example` by `make setup`)
