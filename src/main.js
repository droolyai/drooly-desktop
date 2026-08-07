/**
 * Drooly desktop shell — Maple City ($DDD) / WetDrool 18+.
 * Thin Electron window over the live web game (web stays canonical,
 * DIST-WEB-FIRST-001). Same cloud moshpit as web + Seeker, so desktop
 * players share rooms with every other device automatically.
 */
const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const TARGETS = {
  ddd: {
    title: "Maple City · $DDD",
    url: "https://drooly.ai/games/ddd/",
    bg: "#0a0a0f",
  },
  wetdrool: {
    title: "WetDrool 18+",
    url: "https://drooly.ai/games/wetdrool/",
    bg: "#12060e",
  },
};

function resolveTarget() {
  const envPick = String(process.env.DROOLY_GAME || "").toLowerCase();
  if (TARGETS[envPick]) return envPick;
  try {
    const t = JSON.parse(fs.readFileSync(path.join(__dirname, "target.json"), "utf8"));
    if (TARGETS[t.game]) return t.game;
  } catch {
    /* default */
  }
  return "ddd";
}

const TARGET_KEY = resolveTarget();
const TARGET = TARGETS[TARGET_KEY];

/** Hosts the window may navigate to; everything else opens in the OS browser. */
const ALLOWED_HOSTS = new Set([
  "drooly.ai",
  "www.drooly.ai",
  "icefam.fm",
  "www.icefam.fm",
]);
const ALLOWED_SUFFIXES = [".workers.dev", ".vercel.app"];

function isAllowed(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:" && u.protocol !== "wss:") return false;
    if (ALLOWED_HOSTS.has(u.hostname)) return true;
    return ALLOWED_SUFFIXES.some((s) => u.hostname.endsWith(s));
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 640,
    title: TARGET.title,
    backgroundColor: TARGET.bg,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Any popup / target=_blank goes to the OS browser.
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!isAllowed(url)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  // Crash visibility — owner reported browser crashes; surface don't swallow.
  win.webContents.on("render-process-gone", (_e, details) => {
    const logLine = `[${new Date().toISOString()}] renderer gone: ${details.reason} exitCode=${details.exitCode}\n`;
    try {
      fs.appendFileSync(path.join(app.getPath("userData"), "crash.log"), logLine);
    } catch {
      /* best effort */
    }
    const choice = dialog.showMessageBoxSync(win, {
      type: "error",
      title: TARGET.title,
      message: `The game view crashed (${details.reason}).`,
      detail: "A crash line was written to crash.log in the app data folder.",
      buttons: ["Reload", "Quit"],
      defaultId: 0,
    });
    if (choice === 0) win.loadURL(TARGET.url);
    else app.quit();
  });

  win.webContents.on("did-fail-load", (_e, code, desc, failedUrl, isMainFrame) => {
    if (!isMainFrame) return;
    win.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          `<body style="background:${TARGET.bg};color:#e8e2d8;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0">
             <div style="text-align:center;max-width:26rem">
               <h1 style="font-size:1.4rem">Can't reach the game</h1>
               <p>${TARGET.title} needs an internet connection.<br>(${desc || code})</p>
               <button style="padding:.6rem 1.2rem;font-size:1rem;cursor:pointer" onclick="location.href='${TARGET.url}'">Retry</button>
             </div>
           </body>`
        )
    );
  });

  win.loadURL(TARGET.url);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
