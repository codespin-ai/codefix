import { WebSocketServer, WebSocket } from "ws";
import { registeredApps } from "./handlers/appManager.js";
import { IncomingMessage } from "http";
import internal from "stream";
import { Server } from "http";
import url from "url";

const wsServer = new WebSocketServer({ noServer: true });

const clients = new Map<string, WebSocket>();

wsServer.on("connection", (socket, req) => {
  // Parse query parameters from the request URL
  const query = url.parse(req.url!, true).query;
  const projectPath = query.projectPath as string;

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
      const pathname = url.parse(request.url!).pathname;

      // Check if the request is for the /sync endpoint
      if (pathname === "/sync") {
        wsServer.handleUpgrade(request, socket, head, (ws) => {
          wsServer.emit("connection", ws, request);
        });
      } else {
        socket.destroy(); // Close the connection if it's not for the /sync endpoint
      }
    }
  );
};
