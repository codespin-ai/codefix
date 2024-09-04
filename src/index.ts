#!/usr/bin/env node

import { execSync, fork } from "child_process";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadSettings, saveSettings } from "./settings.js";
import { startServer } from "./server.js"; // Import server start logic

const settings = await loadSettings();
const { port, key } = settings;

yargs(hideBin(process.argv))
  .command(
    "key [key]",
    "Manage the secret key",
    (yargs) =>
      yargs.positional("key", {
        describe: "The secret key to set",
        type: "string",
      }),
    (argv) => {
      if (argv.key) {
        settings.key = argv.key;
        saveSettings(settings);
        console.log("Secret key updated.");
      } else {
        console.log(`Current secret key: ${settings.key}`);
      }
    }
  )
  .command(
    "port [port]",
    "Manage the port",
    (yargs) =>
      yargs.positional("port", {
        describe: "The port to set",
        type: "number",
      }),
    (argv) => {
      if (argv.port) {
        settings.port = argv.port;
        saveSettings(settings);
        console.log(`Port updated to ${argv.port}.`);
      } else {
        console.log(`Current port: ${settings.port}`);
      }
    }
  )
  .command("kill", "Stop the running codefix server", async () => {
    try {
      // Send a request to the server's /kill endpoint
      execSync(`curl -X POST http://localhost:${port}/kill?key=${key}`);
      console.log(`Server on port ${port} has been terminated.`);
    } catch (err) {
      console.error("Failed to terminate the server. Is it running?");
    }
  })
  .command("*", "Start the server and sync projects", async () => {
    const projectPath = path.resolve("."); // The project path to sync

    try {
      // Check if server is running on the specified port
      execSync(`lsof -i :${port}`);
      console.log(`Syncing ${projectPath}`);

      // If the server is running, send a POST request to add the project
      execSync(
        `curl -X POST http://localhost:${port}/projects -d '{"path": "${projectPath}"}' -H "Content-Type: application/json" -H "Authorization: Bearer ${key}"`
      );
    } catch (err) {
      console.log(`Starting codefix server on port ${port}`);

      // If the server is not running, fork a new process to start it
      fork(
        process.argv[1], // Path to the current CLI script
        ["--child", "--project", projectPath], // Pass the child flag and project path
        {
          detached: true, // Detach the child process
          stdio: "ignore", // Ignore stdio to avoid hanging
        }
      );

      process.exit(); // Exit the parent process to allow the child to run
    }
  })
  .help().argv;

// If the `--child` flag is present, start the server in child process mode
if (process.argv.includes("--child")) {
  const projectArgIndex = process.argv.indexOf("--project");
  const projectPath =
    projectArgIndex > -1 ? process.argv[projectArgIndex + 1] : null;

  if (projectPath) {
    // Start the server with the provided project path
    startServer(projectPath); // This will initiate the Express server with the project
  } else {
    console.error("No project path specified for server.");
    process.exit(1);
  }
}
