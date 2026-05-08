// En electron/main.js
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // En desarrollo, carga desde Vite dev server
  win.loadURL('http://localhost:5173');

  // Abrir DevTools automáticamente para ver logs
  win.webContents.openDevTools();

  // Para producción, usar win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(createWindow);

// ESTO ES LO QUE RESPONDE A REACT
ipcMain.handle('get-songs', async () => {
  const musicPath = path.join(process.cwd(), "public", "music");
  
  console.log("Buscando en:", musicPath);

  if (!fs.existsSync(musicPath)) {
    console.error("La carpeta no existe");
    return [];
  }

  const files = fs.readdirSync(musicPath);
  return files
    .filter(file => file.endsWith(".mp3"))
    .map(file => ({
      title: file,
      // En desarrollo usaremos el mismo host/puerto que Vite
      src: `http://localhost:5173/music/${file}`
    }));
});