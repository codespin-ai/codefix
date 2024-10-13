#!/usr/bin/env node

import * as path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadSettings, saveSettings } from "./settings.js";
import { startServer } from "./server.js";

const settings = await loadSettings();

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
        console.log(`Current secret key is "${settings.key}".`);
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
        console.log(`Current port is ${settings.port}.`);
      }
    }
  )
  .command("kill", "Stop the running codefix server", async () => {
    try {
      const response = await fetch(
        `http://localhost:${settings.port}/kill?key=${settings.key}`,
        { method: "POST" }
      );
      if (response.ok) {
        console.log(`Server on port ${settings.port} has been terminated.`);
      } else {
        console.error("Failed to terminate the server. Is it running?");
      }
    } catch (err) {
      console.error("Failed to terminate the server. Is it running?");
    }
  })
  .command(
    "*",
    "Start the server with the specified project",
    (yargs) =>
      yargs.option("project", {
        describe: "Specify a project path",
        type: "string",
      }),
    async (argv) => {
      const projectPath = argv.project
        ? path.resolve(argv.project)
        : path.resolve("."); // Use provided project path or current directory

      try {
        await startServer(projectPath);
        console.log(`Server started for project at path: "${projectPath}"`);
      } catch (err) {
        console.error("Failed to start the server.", err);
      }
    }
  )
  .help().argv;
