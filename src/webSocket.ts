import { WebSocketServer, WebSocket } from "ws";
import { registeredApps } from "./handlers/appManager.js";
import { IncomingMessage } from "http";
import internal from "stream";
import { Server } from "http";

const wsServer = new WebSocketServer({ noServer: true });

const clients = new Map<string, WebSocket>();

wsServer.on("connection", (socket, req) => {
  const workspaceRoot = req.url?.substring(1); // Assuming URL path is /<workspaceRoot>

  if (workspaceRoot && registeredApps.has(workspaceRoot)) {
    clients.set(workspaceRoot, socket);

    socket.on("message", (message) => {
      console.log(`Received message from ${workspaceRoot}: ${message}`);
      // Process the message or forward it to the application logic
    });

    socket.on("close", () => {
      clients.delete(workspaceRoot);
    });
  } else {
    socket.close(4001, "Invalid workspaceRoot");
  }
});

export const getClient = (workspaceRoot: string) => clients.get(workspaceRoot);

export const setupWebSocket = (server: Server) => {
  server.on(
    "upgrade",
    (request: IncomingMessage, socket: internal.Duplex, head: Buffer) => {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit("connection", ws, request);
      });
    }
  );
};
