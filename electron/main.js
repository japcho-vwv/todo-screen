const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 420,
    minHeight: 500,
    title: "할일",
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    // Windows/Linux: 기본 타이틀바 사용
    // macOS: 숨김 처리로 깔끔하게
    ...(process.platform === "darwin"
      ? { titleBarStyle: "hiddenInset" }
      : {}),
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // 개발 시 DevTools 열기 (필요시 주석 해제)
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 외부 링크는 기본 브라우저로 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
