import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

function createWindow() {

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // DESARROLLO
  if (!app.isPackaged) {

    win.loadURL("http://localhost:5173");

  } else {

    // PRODUCCIÓN
    win.loadFile(path.join(rootDir, "dist", "index.html"));

  }
}

app.whenReady().then(createWindow);


// REACT OBTIENE LAS CANCIONES
ipcMain.handle("get-songs", async () => {

  const musicPath = path.join(rootDir, "public", "music");

  if (!fs.existsSync(musicPath)) {
    return [];
  }

  const files = fs.readdirSync(musicPath);

  return files
    .filter(file => file.endsWith(".mp3"))
    .map(file => ({
      title: file,

      // DESARROLLO
      src: !app.isPackaged
        ? `http://localhost:5173/music/${file}`

        // PRODUCCIÓN
        : pathToFileURL(path.join(musicPath, file)).href
    }));
});