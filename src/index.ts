#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import { fork, execSync } from "child_process";
import { startServer } from "./server.js";
import getPort from "get-port";
import { customAlphabet } from "nanoid";

let projectPath: string | null = null;
let lastKeepAlive: number | null = null;

// Function to generate random IDs
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
        const randomId = nanoid(); // ID for internal use
        const processNameId = nanoid(); // Separate ID for process naming

        // This is the parent process, fork a child process with a specific name
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
            execArgv: [`--title=codespin-sync-server-${processNameId}`], // Set process name with a separate ID
          }
        );

        console.log(`Syncing at http://localhost:${port}/project/${randomId}`);
        child.unref();
        process.exit();
      }
    }
  )
  .command(
    "kill",
    "Kill all running instances of the codespin-sync server",
    () => {},
    () => {
      try {
        // Find all process IDs that match the process name pattern
        const pgrepCommand = `pgrep -f "codespin-sync-server-"`;
        const processIds = execSync(pgrepCommand).toString().trim().split("\n");

        let killedCount = 0;

        // Kill each process by its PID
        processIds.forEach((pid) => {
          if (pid) {
            try {
              if (process.platform === "win32") {
                execSync(`taskkill /PID ${pid} /F`);
              } else {
                execSync(`kill -9 ${pid}`);
              }
              killedCount++;
            } catch (error: any) {
              // Continue to the next PID if the process cannot be killed
              if (error.code !== 0) {
                // Possible errors could be process already killed or non-existent
                console.warn(
                  `Failed to kill process with PID ${pid}: ${error.message}`
                );
              }
            }
          }
        });

        console.log(
          `${killedCount} process${killedCount === 1 ? "" : "es"} killed.`
        );
      } catch (error: any) {
        if (error.status === 1) {
          console.log("No processes found to kill.");
        } else {
          console.error("Failed to kill processes:", error.message);
        }
      }
    }
  )
  .help().argv;
