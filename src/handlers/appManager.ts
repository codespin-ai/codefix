import { terminate } from "../index.js";
import { AppRegistration } from "../types.js";
import { getClient } from "../webSocket.js";

export const registeredApps = new Map<string, AppRegistration>();

function cleanUpApp() {
  for (const workspaceRoot of registeredApps.keys()) {
    const registration = registeredApps.get(workspaceRoot);
    if (registration && Date.now() - registration.timestamp >= 60000) {
      registeredApps.delete(workspaceRoot);
    }
  }
  if (registeredApps.size === 0) {
    terminate();
  }
}

setInterval(cleanUpApp, 60000);

export const sendMessageToApp = (workspaceRoot: string, message: any) => {
  const client = getClient(workspaceRoot);
  if (client) {
    client.send(JSON.stringify(message));
  } else {
    console.error(`No client found for workspaceRoot: ${workspaceRoot}`);
  }
};
