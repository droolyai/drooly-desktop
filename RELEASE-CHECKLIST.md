# Release checklist — drooly-desktop

Standing procedure for cutting a release (next: v1.0.3). Agent lanes may do
every step marked [agent]; steps marked **[OWNER]** are his-hands-only and
must never be performed autonomously.

## Before building
- [ ] [agent] `package.json` version bumped to the release tag (lesson from
      v1.0.2: assets inherit `package.json`'s version, and the tag shipped
      with `1.0.0`-named artifacts because it wasn't bumped).
- [ ] [agent] `git status` clean; the commit being released is pushed-worthy
      and its message says what changed since the last tag.

## Build (both apps, per platform)
- [ ] [agent] `npm run build:ddd` → `dist/ddd/` (Maple City)
- [ ] [agent] `npm run build:wetdrool` → `dist/wetdrool/` (WetDrool)
- Targets per `electron-builder.*.json`: macOS dmg+zip (arm64+x64),
  Windows nsis+portable (x64), Linux AppImage (x64). Cross-platform builds
  run from macOS; Windows/Linux artifacts are cross-built (no wine-only
  signing steps are configured — `publish: null` everywhere).

## Local proof gates (before any tag exists)
- [ ] [agent] Launch each macOS .app locally: boot sequence plays, Games menu
      switches targets, window navigation stays inside the allowlist.
- [ ] [agent] File sizes sane vs the previous release (±30% without a known
      reason is a stop-and-explain).
- [ ] [agent] Asset filenames carry the SAME version as the intended tag.

## Publish — staged, never automatic
- [ ] [agent] Stage: draft release notes in `RELEASE-NOTES-v<X>.md`, honest
      scope (what actually changed, what is still unsigned/untested).
- [ ] **[OWNER]** Decision to publish the GitHub release at all.
- [ ] [agent, only after owner's yes] `gh release create v<X> --draft` with
      locally-proven artifacts only; owner flips the draft public.
- [ ] [agent] After publish: `gh release view v<X>` and cross-check every
      asset name + size against the local `dist/` output; log the proof in
      plans/OVERHAUL-LOG.md.

## Signing / notarization — all **[OWNER]**
- macOS is UNSIGNED today (README documents the `xattr -cr` workaround).
  Apple Developer ID enrollment, cert install, and notarization credentials
  are owner steps; when available, wire `mac.identity` + notarize config and
  delete the workaround note from the release body.
- Windows Authenticode signing: same — owner-provided cert or nothing.

## Never
- No republishing/re-uploading assets of an already-public release.
- No release without every artifact proven locally first.
- No invented download counts, platform claims, or version strings.
