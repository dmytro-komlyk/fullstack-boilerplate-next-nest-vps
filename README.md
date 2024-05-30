# Fullstack-Boilerplate-Next-Nest-VPS

## Overview

This repository provides a boilerplate for setting up a Next.js and Nest.js project with Continuous Integration (CI) on a Virtual Private Server (VPS). It includes configurations for various tools and libraries to help you quickly get started with a modern web development stack.

## Features

- Next.js for the frontend
- Nest.js for the backend
- TypeScript for type safety
- Docker for containerization
- CI/CD with GitHub Actions
- Monorepo structure with PNPM Workspaces
- Prisma ORM for database management
- TailwindCSS for styling
- NextAuth for authentication
- tRPC for type-safe APIs
- NextUI for UI components
- Next-Intl for internationalization

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js
- PNPM
- Docker

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dmytro-komlyk/fullstack-boilerplate-next-nest-vps.git
   cd fullstack-boilerplate-next-nest-vps
   ```
  
   or use the repository button [Use this template](https://github.com/new?template_name=fullstack-boilerplate-next-nest-vps&template_owner=dmytro-komlyk)

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment variables**

   ```bash
   cp apps/admin/.env.local.example apps/admin/.env.local
   cp apps/client/.env.local.example apps/client/.env.local
   cp apps/server/.env.example apps/server/.env
   ```

### Running the Project

To start the development environment:

   ```bash
   pnpm dev
   ```

This will concurrently run the Next.js and Nest.js applications.

### Building for Production

1. **To build the project for production:**

   ```bash
   pnpm build
   ```

2. **To start the production build:**

   ```bash
   pnpm start
   ```

### Docker development

To run the project using Docker, use the provided docker-compose files.

1. **Set up environment variables**

   ```bash
   cp apps/admin/.env.docker.local.example apps/admin/.env.docker.local
   cp apps/client/.env.docker.local.example apps/client/.env.docker.local
   cp apps/server/.env.docker.local.example apps/server/.env.docker.local
   ```

2. **Build and run Docker containers**

   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```

## Deploy

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and continuous deployment. The configuration files are located in the .github/workflows directory.

1. **Set up your secrets and variables in a GitHub repository**

   ```bash
    SSH_PASSWORD
    SSH_USERNAME
   ```

   ```bash
    ADMIN_DOMAIN
    APP_DOMAIN
    SERVER_DOMAIN
    BRANCH_DEPLOYMENT
    PROD_NAME
    SSH_FOLDER
    SSH_HOST
    SSH_PORT
   ```

2. **Set up labels in a GitHub repository**

    ```bash
    backend
    frontend-client
    frontend-admin
    ```

### VPS Сonfiguration

1. **Connect to your VPS and run the following commands to install the required dependencies:**

    ```bash
    sudo apt update
    sudo apt install docker.io
    sudo apt install docker-compose
    ```

2. **Create structure, copy files and set up environment variables:**

    ```markdown
    PROD_NAME
    .
    │
    ├── client
    │   └── .env.docker.prod   # Set up environment variables
    ├── admin
    │   └── .env.docker.prod   # Set up environment variables
    ├── server
    │   └── .env.docker.prod   # Set up environment variables
    ├── database
    │   ├── conf   
    │   │   └── mongod.conf.orig
    │   ├── seed   
    │   │   └── *.json  # copy files from mongodb
    │   ├── Dockerfile 
    │   └── init-seed.sh
    └── docker-compose.prod-ci.yml   # Set up your values instead of text with <>
    ```

3. **Run Docker containers:**

    ```bash
    docker login ghcr.io -u <github.repository_owner>
    docker compose -f docker-compose.prod-ci.yml -p <PROD_NAME> pull
    docker compose -f docker-compose.prod-ci.yml -p <PROD_NAME> up -d
    ```

## Folder Structure

```markdown
.
├── .github
│   └── workflows   # CI/CD configurations
├── .vscode   # VSCode settings
├── apps
│   ├── admin   # Next.js app
│   ├── client   # Next.js app
│   ├── database   # MongoDB
│   └── server   # Nest.js app
├── packages
│   └── eslint-config   # Shared ESLint configuration
├── docker-compose*.yml   # Docker configurations
├── pnpm-workspace.yaml   # pnpm workspace configuration
├── README.md   # Project documentation
└── ...  

```
