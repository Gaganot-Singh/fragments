# Fragments

## Project Description (Back-End API)

Repository for a Node.js-based REST API using Express for managing and serving fragments of data.

## Table of Contents

- [Setup](#setup)
- [Scripts](#scripts)
- [Development](#development)

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.1 or above recommended)
- [npm](https://www.npmjs.com/)

# Project Setup and Development Guide

To get started with the project, follow these steps:

### Installation

1. **Clone the repository**:

   ```sh
   git clone https://github.com/Gaganot-Singh/fragments.git
   cd fragments
   ```

2. **Install Dependencies**:

Run the following command to install all necessary dependencies:

```bash
npm install
```

## Install VSCode Extensions

1. **Prettier - Code Formatter**
2. **ESLint**

## Scripts

### Start the Server

#### Normal Start

Starts the server on the default port (8080).

```bash
npm start
```

#### Development Mode

To start the server with nodemon for auto-reloading on code changes, use the following command:

```bash
npm run dev
```

#### Debug Mode

To start Starts the server with nodemon and the Node.js debugger, use the following command:

```bash
npm run debug
```

#### Lint the Code

To run ESLint on the codebase and check for issues, use the following command:

```bash
npm run lint
```

## Development

### Directory Structure

- **src/**: Contains the source code
  - **src/app.js**: Main Express app setup
  - **src/logger.js**: Pino logger configuration
  - **src/server.js**: Server setup with graceful shutdown

## Health Check

- **Endpoint**: `GET /`
- **Description**: Health check to determine if the server is running.

**Response**:

```json
{
  "status": "ok",
  "author": "Gaganjot Singh",
  "githubUrl": "https://github.com/Gaganot-Singh/fragments",
  "version": "0.0.1"
}
```

## Author

**Gaganjot Singh**

- **GitHub Profile**: [Gaganjot Singh's GitHub](https://github.com/Gaganot-Singh)
