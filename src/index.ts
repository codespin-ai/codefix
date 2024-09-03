#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import { fork } from "child_process";
import { startServer } from "./server.js";
import getPort from "get-port";
import { customAlphabet } from "nanoid";

let projectPath: string | null = null;
let lastKeepAlive: number | null = null;

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  16
);

yargs(hideBin(process.argv))
  .command(
    "*",
    "Run the server to sync code with the IDE",
    (yargs) => {
      return yargs
        .option("project", {
          type: "string",
          describe: "Path to the project",
          default: ".", // Default to current directory
        })
        .option("id", {
          type: "string",
          default: "",
        })
        .option("port", {
          type: "number",
          describe: "Port to run the server on",
        })
        .option("auto-exit", {
          type: "boolean",
          describe: "Auto-exit if no keepalives received for 60 secs",
          default: false,
        })
        .option("child", {
          type: "boolean",
          describe: "Flag to indicate child process",
          hidden: true, // Hide this option from the help menu
        });
    },
    async (argv) => {
      if (argv.child) {
        // This is the child process, start the server
        projectPath = path.resolve(argv.project);
        startServer(argv.port ?? 60280, argv.id, argv.autoExit);
      } else {
        const randomId = nanoid();
        // This is the parent process, fork a child process
        projectPath = path.resolve(argv.project);
        lastKeepAlive = Date.now();

        const port = argv.port ?? (await getPort());

        const child = fork(
          process.argv[1],
          [
            "--child",
            "--project",
            projectPath,
            "--port",
            port.toString(),
            "--auto-exit",
            argv.autoExit.toString(),
            "--id",
            randomId,
          ],
          {
            detached: true,
            stdio: "ignore",
          }
        );

        console.log(`Syncing at http://localhost:${port}/project/${randomId}`);
        child.unref();
        process.exit();
      }
    }
  )
  .help().argv;
