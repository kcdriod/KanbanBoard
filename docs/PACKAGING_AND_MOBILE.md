# Packaging and Mobile Plan

## Desktop (Now)

This app is already configured for Electron packaging with `electron-builder`.

### Local packaging

```bash
npm run build:mac
npm run build:win
```

Artifacts are created in `release/`.

### CI packaging

Use the GitHub Actions workflow:

- `.github/workflows/desktop-build.yml`

It builds installers on:

- `macos-latest` (`.dmg`)
- `windows-latest` (`.exe` via NSIS)

Trigger options:

- Manual (`workflow_dispatch`)
- Tag push (`v*`)

## Signing and Notarization (Recommended before distribution)

### macOS

- Add Apple Developer signing identity and notarization credentials as GitHub secrets.
- Configure `electron-builder` `mac` + `notarize` fields if you want Gatekeeper-safe installs.
- Typical CI env vars (electron-builder):
  - `CSC_LINK`
  - `CSC_KEY_PASSWORD`
  - `APPLE_ID`
  - `APPLE_APP_SPECIFIC_PASSWORD`

### Windows

- Add code signing certificate (`.pfx`) and password as GitHub secrets.
- Configure `electron-builder` `win` signing options.
- Typical CI env vars (electron-builder):
  - `WIN_CSC_LINK`
  - `WIN_CSC_KEY_PASSWORD`

## Android and iOS (Future)

Electron cannot ship directly to Android/iOS. Use the React/Vite renderer with Capacitor.

Suggested approach (Capacitor docs / current workflow):

1. Keep Electron for desktop (`electron/` + current scripts).
2. Add Capacitor for mobile shells:
   - `@capacitor/core`
   - `@capacitor/cli`
   - `@capacitor/android`
   - `@capacitor/ios`
3. Initialize Capacitor:
   - `npx cap init`
4. Ensure Capacitor config uses Vite output:
   - `webDir: "dist"`
5. Add platforms:
   - `npx cap add android`
   - `npx cap add ios`
6. Build + sync:
   - `npm run build`
   - `npx cap sync`
7. Open native projects:
   - Android Studio (`npx cap open android`)
   - Xcode (`npx cap open ios`)

This keeps one shared UI/business logic codebase across desktop and mobile.

### Example `capacitor.config.ts`

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lifeflowplanner.mobile",
  appName: "LifeFlowPlanner",
  webDir: "dist",
  bundledWebRuntime: false
};

export default config;
```
