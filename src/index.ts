#!/usr/bin/env node

import { fork } from "child_process";
import * as os from "os";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { startServer } from "./server.js";
import { loadSettings, saveSettings } from "./settings.js";

const settings = await loadSettings();
const { port, key } = settings;

function isPathRestricted(projectPath: string): boolean {
  const homeDir = os.homedir();
  return projectPath === "/" || projectPath === homeDir;
}

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
      // Use fetch to send a request to the /kill endpoint
      const response = await fetch(`http://localhost:${port}/kill?key=${key}`, {
        method: "POST",
      });

      if (response.ok) {
        console.log(`Server on port ${port} has been terminated.`);
      } else {
        console.error("Failed to terminate the server. Is it running?");
      }
    } catch (err) {
      console.error("Failed to terminate the server. Is it running?");
    }
  })
  .command("*", "Start the server and sync projects", async () => {
    const projectPath = path.resolve("."); // The project path to sync

    if (isPathRestricted(projectPath)) {
      console.error(
        "Starting the server in the home directory or root is not allowed for security reasons."
      );
      process.exit(1);
    }

    try {
      // Use fetch to check if the server is running by querying /about
      const response = await fetch(`http://localhost:${port}/about`);
      if (response.ok) {
        // If the server is running, send a POST request to add the project
        const projectResponse = await fetch(
          `http://localhost:${port}/projects?key=${key}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: projectPath }),
          }
        );

        if (projectResponse.ok) {
          console.log(`Added path ${projectPath}`);
        } else {
          console.error(
            "Failed to sync the project. Server responded with an error."
          );
        }
      } else {
        throw new Error("Server is not running.");
      }
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

      console.log(`Added path ${projectPath}`);

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
    if (isPathRestricted(projectPath)) {
      console.error(
        "Starting the server in the home directory or root is not allowed for security reasons."
      );
      process.exit(1);
    }

    // Start the server with the provided project path
    startServer(projectPath); // This will initiate the Express server with the project
  } else {
    console.error("No project path specified for server.");
    process.exit(1);
  }
}
