const { execSync } = require("node:child_process");

const rollupNativeByPlatform = {
  win32: {
    x64: "@rollup/rollup-win32-x64-msvc",
    arm64: "@rollup/rollup-win32-arm64-msvc",
    ia32: "@rollup/rollup-win32-ia32-msvc"
  },
  darwin: {
    x64: "@rollup/rollup-darwin-x64",
    arm64: "@rollup/rollup-darwin-arm64"
  },
  linux: {
    x64: "@rollup/rollup-linux-x64-gnu",
    arm64: "@rollup/rollup-linux-arm64-gnu"
  }
};

const nativePackage = rollupNativeByPlatform[process.platform]?.[process.arch];

if (!nativePackage) {
  process.exit(0);
}

function hasPackage(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

if (hasPackage(nativePackage)) {
  process.exit(0);
}

console.warn(
  `[rollup-native] Missing ${nativePackage}. Installing it with --no-save as a workaround for npm optional dependency resolution issues.`
);

const installEnv = {
  ...process.env,
  npm_config_os: process.platform,
  npm_config_cpu: process.arch
};

execSync(`npm install --no-save ${nativePackage}`, { stdio: "inherit", env: installEnv });

if (!hasPackage(nativePackage)) {
  throw new Error(`[rollup-native] Failed to install ${nativePackage}`);
}
