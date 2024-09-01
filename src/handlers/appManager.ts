import { terminate } from "../index.js";
import { AppRegistration } from "../types.js";
import { getClient } from "../webSocket.js";

export const registeredApps = new Map<string, AppRegistration>();

function cleanUpApp() {
  for (const projectPath of registeredApps.keys()) {
    const registration = registeredApps.get(projectPath);
    if (registration && Date.now() - registration.timestamp >= 60000) {
      registeredApps.delete(projectPath);
    }
  }
  if (registeredApps.size === 0) {
    terminate();
  }
}

setInterval(cleanUpApp, 60000);

export function sendMessageToApp(projectPath: string, message: any) {
  const client = getClient(projectPath);
  if (client) {
    client.send(JSON.stringify(message));
  } else {
    console.error(`No client found for projectPath: ${projectPath}`);
  }
}
