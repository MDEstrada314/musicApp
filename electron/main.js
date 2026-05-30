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

  if (!app.isPackaged) {

    win.loadURL("http://localhost:5173");

  } else {

    win.loadFile(path.join(rootDir, "dist", "index.html"));

  }
}

app.whenReady().then(createWindow);


// REACT OBTIENE LAS CANCIONES
ipcMain.handle("get-songs", async () => {

  // Carpeta Documentos/Music
  const musicPath = path.join(app.getPath("documents"), "Music");

  // Crear carpeta automáticamente si no existe
  if (!fs.existsSync(musicPath)) {
    fs.mkdirSync(musicPath, { recursive: true });
  }

  const files = fs.readdirSync(musicPath);

  return files
    .filter(file => file.endsWith(".mp3"))
    .map(file => ({
      title: file,
      src: pathToFileURL(path.join(musicPath, file)).href
    }));
});