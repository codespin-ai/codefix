import { WebSocketServer, WebSocket } from "ws";
import { registeredApps } from "./handlers/appManager.js";
import { IncomingMessage } from "http";
import internal from "stream";
import { Server } from "http";

const wsServer = new WebSocketServer({ noServer: true });

const clients = new Map<string, WebSocket>();

wsServer.on("connection", (socket, req) => {
  const projectPath = req.url?.substring(1);

  if (projectPath && registeredApps.has(projectPath)) {
    clients.set(projectPath, socket);

    socket.on("message", (message) => {
      console.log(`Received message from ${projectPath}: ${message}`);
    });

    socket.on("close", () => {
      clients.delete(projectPath);
    });
  } else {
    socket.close(4001, "Invalid projectPath");
  }
});

export const getClient = (projectPath: string) => clients.get(projectPath);

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
