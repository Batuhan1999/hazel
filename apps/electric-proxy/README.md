# Electric SQL Proxy Service

A standalone reverse proxy service for Electric SQL, built with Bun and Effect.

## Overview

This service provides a reverse proxy to Electric SQL, handling authentication and request forwarding. It's designed to be independently scalable and runs on Bun's native HTTP server for optimal performance.

## Configuration

The service requires the following environment variables:

- `PORT` - Server port (default: 8080)
- `ELECTRIC_URL` - Electric SQL server URL
- `ELECTRIC_SECRET` - Electric SQL secret for authentication
- `ELECTRIC_SOURCE_ID` - Electric SQL source identifier

## Development

```bash
# Install dependencies
bun install

# Run in development mode (with hot reload)
bun run dev

# Run in production mode
bun run start

# Type checking
bun run typecheck
```

## API Endpoint

The proxy exposes a single endpoint:

- `GET /electric/proxy` - Proxy requests to Electric SQL
  - Required query parameter: `table` - The table name to query
  - Optional parameters: `live`, `handle`, `offset`, `cursor`

## Features

- Built with Bun's native HTTP server for high performance
- Effect-based error handling and configuration management
- CORS support for browser-based clients
- Streaming response support for SSE (Server-Sent Events)
- Automatic header cleanup and modification

## Architecture

The service uses:
- **Bun** - JavaScript runtime and HTTP server
- **Effect** - Functional programming library for error handling and configuration
- **TypeScript** - Type safety and better developer experience

## Deployment

This service can be deployed independently and scaled horizontally. It maintains no state and can be run behind a load balancer.