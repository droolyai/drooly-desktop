/**
 * Drooly desktop shell — Maple City (DDD) / WetDrool 18+.
 * Thin Electron window over the live web game (web stays canonical,
 * DIST-WEB-FIRST-001). Same cloud moshpit as web + Seeker, so desktop
 * players share rooms with every other device automatically.
 *
 * "GTA-quality, not a bare wrapper" (owner directive): a real animated boot
 * sequence (boot.html — dusk palette, grain, rotating tips, progress sweep)
 * covers the load instead of a flash of white/blank window, and the app
 * carries every game behind one Games menu — you don't need a second
 * installer to switch from Maple City to WetDrool.
 */
const { app, BrowserWindow, shell, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const TARGETS = {
  ddd: {
    title: "Maple City · DDD",
    label: "Maple City (DDD)",
    url: "https://drooly.ai/games/ddd/",
    bg: "#0a0a0f",
    bootSub: "MAPLE CITY",
  },
  wetdrool: {
    title: "WetDrool 18+",
    label: "WetDrool (18+)",
    url: "https://drooly.ai/games/wetdrool/",
    bg: "#12060e",
    bootSub: "WETDROOL · 18+",
  },
};

const MIN_BOOT_MS = 2200; // long enough to read a tip, short enough to not feel stuck

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

let currentKey = resolveTarget();

/** Hosts the window may navigate to; everything else opens in the OS browser. */
const ALLOWED_HOSTS = new Set(["drooly.ai", "www.drooly.ai", "icefam.fm", "www.icefam.fm"]);
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

/** @type {BrowserWindow|null} */
let mainWin = null;
/** @type {BrowserWindow|null} */
let bootWin = null;

function openBoot(targetKey) {
  const t = TARGETS[targetKey];
  const win = new BrowserWindow({
    width: 720,
    height: 460,
    frame: false,
    resizable: false,
    movable: true,
    center: true,
    show: false,
    backgroundColor: t.bg,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  // Same navigation guards as the main window (gilfoyle-infra review): boot.html
  // is static today, but it runs page JS (the tip rotator) and has no allowlist
  // of its own — defense-in-depth so a future edit can't silently add a live
  // link/redirect with zero guard.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!isAllowed(url)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  win.loadFile(path.join(__dirname, "boot.html")).then(() => {
    win.webContents.executeJavaScript(
      `window.__DROOLY_BOOT_SUB__ = ${JSON.stringify(t.bootSub)}; document.getElementById("target-sub").textContent = ${JSON.stringify(t.bootSub)};`
    ).catch(() => {});
    win.show();
  });
  return win;
}

function buildMenu() {
  const template = [
    ...(process.platform === "darwin"
      ? [{ label: app.getName(), submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }] }]
      : []),
    {
      label: "Games",
      submenu: Object.keys(TARGETS).map((key) => ({
        label: TARGETS[key].label,
        type: "radio",
        checked: key === currentKey,
        click: () => switchGame(key),
      })),
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function switchGame(targetKey) {
  if (!TARGETS[targetKey]) return;
  if (targetKey === currentKey && mainWin) return; // already on this game
  currentKey = targetKey;
  buildMenu();
  const t = TARGETS[targetKey];
  if (mainWin) {
    mainWin.setTitle(t.title);
    mainWin.setBackgroundColor(t.bg);
  }
  const boot = openBoot(targetKey);
  const startedAt = Date.now();
  let mainReady = false;

  const finish = () => {
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, MIN_BOOT_MS - elapsed);
    setTimeout(() => {
      if (mainWin) {
        mainWin.show();
        mainWin.focus();
      }
      if (!boot.isDestroyed()) boot.close();
    }, wait);
  };

  if (!mainWin) {
    mainWin = createWindow(targetKey, () => {
      mainReady = true;
      finish();
    });
  } else {
    mainWin.hide();
    mainWin.loadURL(t.url);
    mainWin.webContents.once("did-finish-load", () => {
      mainReady = true;
      finish();
    });
  }
  // safety: never leave the player staring at the boot screen forever
  setTimeout(() => {
    if (!mainReady) finish();
  }, 9000);
}

function createWindow(targetKey, onFirstLoad) {
  const t = TARGETS[targetKey];
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 640,
    title: t.title,
    backgroundColor: t.bg,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!isAllowed(url)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  win.webContents.on("render-process-gone", (_e, details) => {
    const logLine = `[${new Date().toISOString()}] renderer gone: ${details.reason} exitCode=${details.exitCode}\n`;
    try {
      fs.appendFileSync(path.join(app.getPath("userData"), "crash.log"), logLine);
    } catch {
      /* best effort */
    }
    const choice = dialog.showMessageBoxSync(win, {
      type: "error",
      title: TARGETS[currentKey].title,
      message: `The game view crashed (${details.reason}).`,
      detail: "A crash line was written to crash.log in the app data folder.",
      buttons: ["Reload", "Quit"],
      defaultId: 0,
    });
    if (choice === 0) win.loadURL(TARGETS[currentKey].url);
    else app.quit();
  });

  win.webContents.on("did-fail-load", (_e, code, desc, failedUrl, isMainFrame) => {
    if (!isMainFrame) return;
    win.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          `<body style="background:${t.bg};color:#e8e2d8;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0">
             <div style="text-align:center;max-width:26rem">
               <h1 style="font-size:1.4rem">Can't reach the game</h1>
               <p>${t.title} needs an internet connection.<br>(${desc || code})</p>
               <button style="padding:.6rem 1.2rem;font-size:1rem;cursor:pointer" onclick="location.href='${t.url}'">Retry</button>
             </div>
           </body>`
        )
    );
    if (onFirstLoad) { onFirstLoad(); onFirstLoad = null; }
  });

  win.webContents.once("did-finish-load", () => {
    if (onFirstLoad) { onFirstLoad(); onFirstLoad = null; }
  });

  win.loadURL(t.url);
  return win;
}

app.whenReady().then(() => {
  buildMenu();
  const boot = openBoot(currentKey);
  const startedAt = Date.now();
  bootWin = boot;

  const finish = () => {
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, MIN_BOOT_MS - elapsed);
    setTimeout(() => {
      if (mainWin) {
        mainWin.show();
        mainWin.focus();
      }
      if (!boot.isDestroyed()) boot.close();
      bootWin = null;
    }, wait);
  };

  mainWin = createWindow(currentKey, finish);
  // safety net so a slow/broken load never leaves only the boot screen visible
  setTimeout(() => {
    if (mainWin && !mainWin.isVisible()) finish();
  }, 9000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWin = createWindow(currentKey, () => {
        if (mainWin) mainWin.show();
      });
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
