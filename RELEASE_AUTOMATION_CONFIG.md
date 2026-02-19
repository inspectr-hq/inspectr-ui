# Release Dispatch Configuration

## Required secret
- Add `REPO_Y_DISPATCH_TOKEN` in this repository (`inspectr-ui`).
- Token must be able to dispatch events to `inspectr-hq/inspectr-app`.
- Suggested scopes:
  - Classic PAT: `public_repo` (or `repo` if private)
  - Or GitHub App token with access to the target repository.

## Dispatch target
- Owner: `thim81`
- Repo Y: `inspectr-app`
- Event type: `repo-released`

## Payload sent to Repo Y
- `version`: release tag name (for example `v1.2.3` or `1.2.3`)
- `repo`: source repository (`inspectr-hq/inspectr-ui`)
- `release_url`: GitHub release URL
