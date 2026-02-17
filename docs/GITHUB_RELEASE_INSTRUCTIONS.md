# GitHub Desktop Release Instructions

This project uses `.github/workflows/desktop-build.yml` to automate:
- versioning
- changelog generation
- GitHub Release creation
- Windows/macOS installer upload

## 1. What the workflow does

On push to `main`:
1. Runs `release-please` to create/update a Release PR.
2. Release PR contains:
   - version bump
   - generated changelog
3. When Release PR is merged:
   - GitHub tag + release are created
   - Windows + macOS installers are built
   - installers are uploaded to the Release page

## 2. Commit format (controls version bump)

Use Conventional Commits:

- `fix: ...` => patch bump (`1.0.0` -> `1.0.1`)
- `feat: ...` => minor bump (`1.0.0` -> `1.1.0`)
- `feat!: ...` or `BREAKING CHANGE:` => major bump (`1.0.0` -> `2.0.0`)

Examples:

```bash
git commit -m "fix: correct drag-and-drop ordering in section dialog"
git commit -m "feat: add workspace sharing UI"
git commit -m "feat!: migrate board schema to sections v2"
```

## 3. Release process (team workflow)

1. Merge regular feature/fix PRs into `main`.
2. Wait for `release-please` to open/update the Release PR.
3. Review the Release PR title/body/changelog.
4. Merge the Release PR.
5. Wait for the workflow to finish (build + asset upload).
6. Open GitHub Releases and verify downloadable files:
   - Windows setup `.exe`
   - macOS `.dmg`

Installer naming on release page:
- Windows: `*-signed.exe` or `*-unsigned.exe`
- macOS: `*-signed.dmg` or `*-unsigned.dmg`

## 4. Manual run

You can run the workflow manually from **Actions -> Desktop Release -> Run workflow**.

Inputs:
- `force_build` (default: `true`): build installers even if no new release is created.
- `publish_to_release` (default: `false`): upload built assets to an existing release.
- `release_tag`: required when `publish_to_release` is `true` (example: `v1.2.3`).

## 5. One-time repository checks

1. Ensure Actions are enabled for the repo.
2. Ensure workflow permissions allow writing:
   - `contents: write`
   - `pull-requests: write`
3. Ensure branch protection allows merging Release PRs.

No personal `GH_TOKEN` is required for this workflow; it uses `${{ secrets.GITHUB_TOKEN }}`.

## 6. Troubleshooting

### A) `GH_TOKEN` publish error from electron-builder
Cause:
- electron-builder tried to publish during build step.

Fix in workflow:
- build with `--publish never` (already configured).

### B) `EBADPLATFORM @rollup/rollup-win32-x64-msvc` on macOS runner
Cause:
- Windows-only Rollup binary pinned as direct dependency.

Fix:
- remove `@rollup/rollup-win32-x64-msvc` from direct `devDependencies` (already done).

### C) Release created but no installers attached
Checks:
1. Confirm `build` job succeeded for both matrix targets.
2. Confirm `publish-assets` job ran.
3. Verify release artifacts exist in `release-assets/**` in workflow logs.

### D) `Build Desktop Installers` job was skipped
Cause:
- No release was created by `release-please` in that run.

How to run build anyway:
1. Start workflow manually.
2. Set `force_build = true`.
3. (Optional) set `publish_to_release = true` and provide `release_tag`.

### E) `gh release upload` failed with `not a git repository`
Cause:
- Publish job did not have a checked out repo and `gh` could not infer repository context.

Fix in workflow:
- pass repository explicitly: `--repo "$GITHUB_REPOSITORY"` (already configured).

### F) `gh release upload` failed with `release not found`
Cause:
- target tag resolved, but GitHub release object did not exist yet.

Fix in workflow:
1. resolve tag explicitly before upload.
2. check/retry release lookup.
3. create release if it still does not exist, then upload assets.

## 7. Signing and notarization setup

The workflow is already wired to read signing secrets.  
If secrets are present, installers are signed/notarized.  
If secrets are missing, builds still run but remain unsigned.

### 7.1 Required repository secrets

Windows signing:
- `WIN_CSC_LINK` (base64 `.p12` cert or file/url per electron-builder docs)
- `WIN_CSC_KEY_PASSWORD`
- `WIN_CSC_NAME` (optional publisher/cert name)

macOS signing:
- `MAC_CSC_LINK` (Developer ID Application `.p12`)
- `MAC_CSC_KEY_PASSWORD`
- `MAC_CSC_NAME` (optional identity override)

macOS notarization (Apple ID flow):
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Alternative notarization (App Store Connect API key flow):
- `APPLE_API_KEY`
- `APPLE_API_KEY_ID`
- `APPLE_API_ISSUER`

Use either Apple ID flow or API key flow.

### 7.2 Certificate preparation tips

Convert cert to base64 for GitHub secret:

```bash
# macOS
base64 -i certificate.p12 -o cert-base64.txt

# Linux
base64 certificate.p12 > cert-base64.txt
```

Then paste the base64 content into the corresponding secret.

### 7.3 Where this is configured

- Workflow env injection:
  - `.github/workflows/desktop-build.yml` (`Build installer` step)
- macOS hardened runtime + entitlements:
  - `package.json` (`build.mac`)
  - `build/entitlements.mac.plist`
  - `build/entitlements.mac.inherit.plist`

### 7.4 Expected result

With valid certs + notarization credentials:
- Windows installer `.exe` is code-signed
- macOS app/DMG is signed and notarized
- users see far fewer SmartScreen/Gatekeeper warnings
- release assets include `-signed` suffix in installer filename

Without signing secrets:
- release assets include `-unsigned` suffix in installer filename
