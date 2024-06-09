import bodyParser from "body-parser";
import { fork } from "child_process";
import express from "express";
import { Server } from "http";
import { fileURLToPath } from "url";
import { keepAlive } from "./handlers/keepalive.js";
import { send } from "./handlers/send.js";
import { setupWebSocket } from "./webSocket.js";

let server: Server | null = null;
let isStarted = false;

const PORT = 60280;
const url = `http://localhost:${PORT}/keepalive`;

export async function start(invokedViaCLI = false) {
  if (isStarted) {
    return;
  }

  // Check if this is a parent process and needs to fork
  if (!invokedViaCLI && !process.argv.includes("child")) {
    const __filename = fileURLToPath(import.meta.url);
    const child = fork(__filename, ["child"]);

    child.on("message", (message) => {
      console.log("Message from child:", message);
    });

    child.on("error", (error) => {
      console.error("Failed to fork child process:", error);
    });

    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
    });

    return;
  }

  // Actual server start logic
  const app = express();

  app.use(bodyParser.json());
  app.post("/keepalive", keepAlive);
  app.post("/send", send);

  try {
    server = app.listen(PORT, () => {
      isStarted = true;
      console.log(`Server is running on port ${PORT}`);
      if (server !== null) {
        setupWebSocket(server);
      } else {
        throw new Error("Cannot upgrade to support WS; Server is null.");
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

export async function register(workspaceRoot: string) {
  const sendKeepAlive = async () => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceRoot }),
      });

      if (!response.ok) {
        throw new Error(`Error sending keepalive: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error sending keepalive:", error);
    }
  };

  const startPingProcess = async () => {
    // First ping immediately
    await sendKeepAlive();

    // Then ping after 10 seconds
    setTimeout(async () => {
      await sendKeepAlive();
      // Then ping every 30 seconds
      setInterval(sendKeepAlive, 30000);
    }, 10000);
  };

  try {
    await sendKeepAlive();
    startPingProcess();
  } catch (error) {
    console.error(
      "Initial keepalive failed, attempting to start server:",
      error
    );
    await start();
    setTimeout(async () => {
      await sendKeepAlive();
      startPingProcess();
    }, 10000);
  }
}

export async function terminate() {
  if (server) {
    server.close(() => {
      isStarted = false;
      console.log("Server has been terminated");
      process.exit();
    });
  }
}

const __filename = fileURLToPath(import.meta.url);

if (import.meta.url === `file://${__filename}`) {
  start(true);
}
