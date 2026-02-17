const { execSync } = require("node:child_process");
const { existsSync } = require("node:fs");

function resolveElectronBinary() {
  const electronModulePath = require.resolve("electron");
  delete require.cache[electronModulePath];
  return require("electron");
}

function hasElectronBinary() {
  try {
    const electronBinary = resolveElectronBinary();
    return existsSync(electronBinary);
  } catch {
    return false;
  }
}

if (hasElectronBinary()) {
  process.exit(0);
}

console.warn(
  "[electron-native] Missing platform Electron binary. Rebuilding electron package for current OS/arch."
);

const installEnv = {
  ...process.env,
  npm_config_platform: process.platform,
  npm_config_arch: process.arch
};

delete installEnv.ELECTRON_RUN_AS_NODE;

execSync("npm rebuild electron --foreground-scripts", {
  stdio: "inherit",
  env: installEnv
});

if (!hasElectronBinary()) {
  throw new Error("[electron-native] Failed to install a usable Electron binary.");
}
