import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const settingsPath = path.join(os.homedir(), ".codespin", "codefix.json");

interface Settings {
  key: string;
  port: number;
}

export async function loadSettings(): Promise<Settings> {
  if (!fs.existsSync(settingsPath)) {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    const key = await promptForKey(); // Await user input using readline
    const defaultSettings: Settings = {
      key: key,
      port: 60280,
    };
    saveSettings(defaultSettings);
    return defaultSettings;
  } else {
    const data = fs.readFileSync(settingsPath, "utf-8");
    return JSON.parse(data) as Settings;
  }
}

export function saveSettings(settings: Settings): void {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}

export function promptForKey(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter a secret key (and remember it): ", (key: string) => {
      rl.close();
      resolve(key);
    });
  });
}
