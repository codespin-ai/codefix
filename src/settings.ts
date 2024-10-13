import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";

const settingsPath = path.join(os.homedir(), ".codespin", "codefix.json");

interface Settings {
  key: string;
  port?: number;
}

export async function loadSettings(): Promise<Settings> {
  if (!fs.existsSync(settingsPath)) {
    console.log("The auth key was not found. Let's create one.");
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    const key = await promptForKey(); // Await user input using readline
    const defaultSettings: Settings = {
      key: key,
    };
    saveSettings(defaultSettings);
    console.log(`Saved key to ${settingsPath}.`);
    return defaultSettings;
  } else {
    const data = fs.readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(data) as Settings;
    settings.port = settings.port ?? 60280;
    return settings;
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
