import { app, BrowserWindow, dialog, screen, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.env.ProgramData || 'C:\\ProgramData', 'CrepettooPOS');
const DB_PATH = path.join(DATA_DIR, 'crepettoo.db');
const SECRET_PATH = path.join(DATA_DIR, 'jwt.secret');
const LOG_PATH = path.join(DATA_DIR, 'electron.log');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const logFile = fs.openSync(LOG_PATH, 'a');
const logStream = fs.createWriteStream(null, { fd: logFile });

const origLog = console.log;
const origErr = console.error;
console.log = (...args) => {
  const msg = args.map(a => (a instanceof Error ? a.stack : (typeof a === 'object' ? JSON.stringify(a) : String(a)))).join(' ');
  logStream.write(`[${new Date().toISOString()}] [LOG] ${msg}\n`);
  origLog.apply(console, args);
};
console.error = (...args) => {
  const msg = args.map(a => (a instanceof Error ? a.stack : (typeof a === 'object' ? JSON.stringify(a) : String(a)))).join(' ');
  logStream.write(`[${new Date().toISOString()}] [ERR] ${msg}\n`);
  origErr.apply(console, args);
};

let mainWindow = null;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function setupAppConfig() {
  ensureDir(DATA_DIR);

  if (!fs.existsSync(DB_PATH)) {
    const emptyDb = path.join(__dirname, '..', 'prisma', 'crepettoo-empty.db');
    const fallback = path.join(__dirname, '..', 'resources', 'crepettoo-empty.db');
    const src = fs.existsSync(emptyDb) ? emptyDb : (fs.existsSync(fallback) ? fallback : null);
    if (src) {
      const tmpPath = `${DB_PATH}.tmp-${Date.now()}`;
      try {
        fs.copyFileSync(src, tmpPath);
        fs.renameSync(tmpPath, DB_PATH);
        console.log(`[app] Copied empty DB from ${src}`);
      } catch (err) {
        console.error('[app] Failed to copy database template:', err);
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
      }
    } else {
      console.error('[app] No empty database template found.');
    }
  }

  if (!fs.existsSync(SECRET_PATH)) {
    const secret = crypto.randomBytes(48).toString('base64');
    fs.writeFileSync(SECRET_PATH, secret, 'utf-8');
  }
  const jwtSecret = fs.readFileSync(SECRET_PATH, 'utf-8').trim();

  process.env.DATABASE_URL = `file:${DB_PATH}`;
  process.env.JWT_SECRET = jwtSecret;
  process.env.PORT = '4000';
}

async function bootServer() {
  const serverPath = path.join(__dirname, '..', 'dist-server', 'index.js');
  if (fs.existsSync(serverPath)) {
    try {
      await import(pathToFileURL(serverPath).href);
      console.log('[app] Server started');
    } catch (err) {
      console.error('[app] Server import failed:', err);
    }
  } else {
    console.error('[app] Server not built. Run: npm run build:server');
  }
}

// ---------- Silent printing (no OS/Windows dialog) ----------
ipcMain.handle('print:silent', async (_event, html, opts = {}) => {
  const copies = Math.min(Math.max(parseInt(opts.copies, 10) || 1, 1), 10);
  const paperWidth = opts.paperWidth === 58 ? 58 : 80;
  const height = 254000; // 254mm — long enough for receipts
  const printWin = new BrowserWindow({
    show: false,
    width: 400,
    height: 600,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  try {
    await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise((r) => setTimeout(r, 350));
    const result = await new Promise((resolve) => {
      printWin.webContents.print(
        {
          silent: true,
          printBackground: true,
          copies,
          pageSize: { width: paperWidth * 1000, height },
          margins: { marginType: 'none' },
        },
        (success, failureReason) => {
          if (!success) console.error('[print] silent print failed:', failureReason);
          resolve({ ok: !!success, error: success ? null : (failureReason || 'failed') });
        }
      );
    });
    return result;
  } catch (err) {
    console.error('[print] silent print error:', err);
    return { ok: false, error: String(err?.message || err) };
  } finally {
    if (!printWin.isDestroyed()) printWin.destroy();
  }
});

function createWindow() {
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.min(1360, workArea.width),
    height: Math.min(860, workArea.height),
    minWidth: 960,
    minHeight: 600,
    title: 'CrepettooPOS',
    backgroundColor: '#FAF6EE',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.loadURL('http://localhost:4000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

process.on('uncaughtException', (err) => {
  console.error('[app] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[app] Unhandled rejection:', reason);
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    setupAppConfig();
    await bootServer();

    let serverReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const resp = await fetch('http://localhost:4000/api/health');
        if (resp.ok) { serverReady = true; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!serverReady) {
      console.error('[app] Server failed to start after 30 seconds');
      dialog.showErrorBox(
        'CrepettooPOS',
        'تعذر تشغيل خادم التطبيق.\n\nالسبب المحتمل: المنفذ 4000 مشغول بتطبيق آخر.\nأغلق البرنامج المتعارض ثم أعد تشغيل CrepettooPOS.\n\nLe serveur n\'a pas pu démarrer (port 4000 occupé).'
      );
      app.quit();
      return;
    }
    createWindow();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
