const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";

let mainWindow = null;
let popupWindow = null;

function createMainWindow() {
  if (mainWindow) { mainWindow.focus(); return; }
  mainWindow = new BrowserWindow({
    width: 960, height: 720, minWidth: 420, minHeight: 500,
    title: "할일", backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    ...(process.platform === "darwin" ? { titleBarStyle: "hiddenInset" } : {}),
  });
  if (isDev) { mainWindow.loadURL("http://localhost:5173"); }
  else { mainWindow.loadFile(path.join(__dirname, "../dist/index.html")); }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  mainWindow.on("closed", () => { mainWindow = null; if (!popupWindow) { if (process.platform !== "darwin") app.quit(); } });
}

function createPopupWindow() {
  if (popupWindow) { popupWindow.focus(); return; }
  popupWindow = new BrowserWindow({
    width: 300, height: 420, minWidth: 240, minHeight: 200, maxWidth: 420,
    title: "할일 팝업", alwaysOnTop: true, frame: false, transparent: false,
    resizable: true, skipTaskbar: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  if (isDev) { popupWindow.loadURL("http://localhost:5173/?popup=true"); }
  else { popupWindow.loadFile(path.join(__dirname, "../dist/index.html"), { query: { popup: "true" } }); }
  popupWindow.on("closed", () => { popupWindow = null; if (!mainWindow) { if (process.platform !== "darwin") app.quit(); } });
}

ipcMain.handle("open-popup",  () => createPopupWindow());
ipcMain.handle("close-popup", () => { if (popupWindow) popupWindow.close(); });
ipcMain.handle("open-main",   () => createMainWindow());
ipcMain.handle("close-main",  () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle("storage-changed", (e, data) => {
  const windows = [mainWindow, popupWindow].filter(Boolean);
  windows.forEach(win => { if (win && win.webContents !== e.sender) win.webContents.send("storage-update", data); });
});

app.whenReady().then(() => {
  createMainWindow();
  app.on("activate", () => { if (!mainWindow && !popupWindow) createMainWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
