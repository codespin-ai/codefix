# CodeFix

## Overview

CodeFix is a CLI tool for managing and syncing local projects. It allows you to add, manage, and access project files via a local server.

## Installation

Install CodeFix globally via npm:

```bash
npm install -g codefix
```

## Usage

### Start the Server

Start the server and sync a project:

```bash
codefix --project /path/to/project
```

If no project path is specified, it defaults to the current directory.

### Manage Secret Key

View or update the secret key:

```bash
codefix key [new-key]
```

### Manage Port

View or update the port:

```bash
codefix port [new-port]
```

### Stop the Server

Stop the running server:

```bash
codefix kill
```

### Add Project via API

After the server is running, add a new project:

```bash
curl -X POST http://localhost:60280/projects?key=your-secret-key -d '{"path":"/path/to/project"}'
```

### File Operations

Retrieve or update files via API.

#### Get File:

```bash
curl http://localhost:60280/projects/[project-id]/files/[file-path]?key=your-secret-key
```

#### Update File:

```bash
curl -X POST http://localhost:60280/projects/[project-id]/files/[file-path]?key=your-secret-key -d '{"contents":"new content"}'
```

## Configuration

Settings like the secret key and port are saved in `~/.codespin/codefix.json`.
