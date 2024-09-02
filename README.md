# Codespin Sync Server

A lightweight CLI tool to sync code with an IDE, run as a background server, and handle code updates securely.

## Features

- **Run as a Background Server:** Automatically forks the server process to run in the background when started.
- **Alphanumeric Project ID:** Generates a unique alphanumeric ID for each project session.
- **Automatic Port Selection:** Randomly selects an available port if none is provided.
- **Keepalive Mechanism:** Option to automatically terminate the server if no keepalive requests are received for 60 seconds.
- **Secure File Writing:** Validates the file path before writing to ensure it's within the project directory.

## Installation

```bash
npm i -g codespin-sync
```

## Usage

### Start the Server

To start the server and sync a project, simply run:

```bash
codespin-sync --project /path/to/your/project
```

Options:

- `--project` (required): The absolute path to the project directory you want to sync.
- `--port` (optional): The port number to run the server on. If not provided, a random available port will be selected.
- `--auto-exit` (optional): If set to `true`, the server will automatically exit if no keepalive requests are received for 60 seconds.

Example:

```bash
codespin-sync --project /home/user/myproject --port 8080 --auto-exit
```

Output:

```bash
Syncing at http://localhost:8080/project/abc123def456ghi7
```

### Keepalive Endpoint

To keep the server running (if --auto-exit was mentioned), send a POST request to the following endpoint:

```
POST http://localhost:8080/project/abc123def456ghi7/keepalive
```

Request Body:

```json
{
  "id": "abc123def456ghi7"
}
```

### Write Code to the Project

To write code to a file in the project, send a POST request to the following endpoint:

```
POST http://localhost:8080/project/abc123def456ghi7/write
```

Request Body:

```json
{
  "id": "abc123def456ghi7",
  "type": "code",
  "filePath": "src/index.js",
  "contents": "console.log('Hello, world!');"
}
```

## Development

### Running the Server Locally

To run the server locally for development, you can use the following command:

```bash
npm start -- --project /path/to/your/project
```

### Testing

You can run tests to ensure everything is working as expected:

```bash
npm test
```

## License

MIT License. See `LICENSE` for more information.

## Contributions

Contributions are welcome! Please submit a pull request or open an issue to discuss any changes or enhancements.

---

This README provides a comprehensive overview of your project, including installation, usage, and development instructions. You can customize it further to suit your specific needs.