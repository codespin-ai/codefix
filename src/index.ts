#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { fork } from "child_process";
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { Server } from "http";
import { customAlphabet } from "nanoid";
import getPort from "get-port";
import cors from "cors";

let server: Server | null = null;
let isStarted = false;
let projectPath: string | null = null;
let lastKeepAlive: number | null = null;

// Generate an alphanumeric ID
const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  16
);

async function startServer(port: number, projectId: string, autoExit: boolean) {
  if (isStarted) return;

  const app = express();

  // Configure CORS
  const allowedOrigins = [
    "https://chatgpt.com",
    "https://chat.openai.com",
    "https://claude.ai",
  ];

  app.use(
    cors({
      origin: (origin: any, callback: any) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      allowedHeaders: ["Content-Type", "Access-Control-Allow-Private-Network"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.use(bodyParser.json());

  app.post(`/project/:id/keepalive`, (req, res) => {
    const { id } = req.params;

    if (!id || id !== projectId) {
      return res.status(400).json({ error: "Invalid id" });
    }
    lastKeepAlive = Date.now();
    res.json({ result: "keepalive received" });
  });

  app.post(`/project/:id/write`, (req, res) => {
    const { id } = req.params;
    const { type, filePath, contents } = req.body;

    if (!id || id !== projectId) {
      return res.status(400).json({ error: "Invalid id" });
    }

    if (!projectPath) {
      return res.status(400).json({ error: "Invalid project path" });
    }

    const fullPath = path.join(projectPath, filePath);

    if (!fullPath.startsWith(projectPath)) {
      return res.status(400).json({ error: "Invalid filePath" });
    }

    if (type !== "code") {
      return res.status(400).json({ error: "Invalid type" });
    }

    fs.writeFileSync(fullPath, contents, "utf-8");
    res.json({ result: "File written successfully" });
  });

  server = app.listen(port, () => {
    isStarted = true;
    console.log(`Server is running on port ${port}`);
  });

  if (autoExit) {
    setInterval(() => {
      if (lastKeepAlive && Date.now() - lastKeepAlive > 60000) {
        terminateServer();
      }
    }, 60000);
  }
}

function terminateServer() {
  if (server) {
    server.close(() => {
      isStarted = false;
      console.log("Server has been terminated");
      process.exit();
    });
  }
}

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
