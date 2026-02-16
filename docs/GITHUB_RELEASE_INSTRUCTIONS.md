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

## 7. Recommended next step (optional)

For production-grade public distribution, add signing:
- Windows code-signing certificate
- macOS signing + notarization

This removes warning dialogs for end users during install.
