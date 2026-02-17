const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("node:path");

const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const appName = "LifeFlow Planner";
const desktopIconPath = path.join(__dirname, "..", "build", "icons", "icon-1024.png");

function createMainWindow() {
  const window = new BrowserWindow({
    title: appName,
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    icon: desktopIconPath,
    show: false,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.once("ready-to-show", () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (devServerUrl) {
    window.loadURL(devServerUrl);
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  app.setName(appName);
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("app:getVersion", () => app.getVersion());
