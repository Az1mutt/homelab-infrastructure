# AGENTS.md

## Repository purpose

This is a public documentation repository for a real homelab. Work must preserve factual accuracy, operational safety, and privacy.

## Instruction refresh

Before any task that will write to GitHub, read the current `AGENTS.md` from the repository default branch. Do not rely on an older chat copy of these rules when the repository version is available.

## Source-of-truth rules

1. Distinguish the current verified host/runtime state from planned or historical infrastructure.
2. Use these status labels consistently:
   - **Verified**: supported by user confirmation, command output, logs, screenshots, or direct inspection.
   - **Component-tested**: an integration test passed, but the complete workflow did not.
   - **Planned**: selected or intended but not implemented.
   - **Blocked**: cannot proceed because a prerequisite is missing.
   - **Unknown**: insufficient evidence; do not infer a value.
   - **Historical**: describes an earlier event, not the current configuration.
3. A newer explicitly confirmed state overrides an older handoff.
4. Never convert a proposal into an implemented claim without new evidence.
5. Prefer live, sanitized command output over remembered configuration when both are available.

## Public-repository safety

Never commit:

- passwords, API keys, tokens, cookies, private keys, or `.env` files;
- usable Plex, TMDb, SABnzbd, indexer, Usenet, or VPN credentials;
- public IP addresses, router configuration, or unnecessary LAN identifiers;
- personal email addresses, account identifiers, invoices, warranty documents, or order numbers;
- full disk serial numbers;
- unsanitized Compose, application configuration, logs, screenshots, or command output.

Use placeholders such as `<HOST_LAN_IP>`, `<PLEX_TOKEN>`, `<TMDB_API_KEY>`, and `<SABNZBD_API_KEY>` in examples.

Run a secret scan before every commit that introduces configuration, logs, or generated output.

## Change safety

- Documentation-only tasks must not connect to or modify the live homelab.
- Do not execute SQL, Docker, filesystem, partitioning, formatting, mount, SMART test, package-management, or network changes unless the task explicitly authorizes live infrastructure work.
- Begin disk work with read-only inventory commands.
- Treat partition deletion, filesystem creation, formatting, burn-in tests, recursive permission changes, and data movement as destructive operations requiring explicit confirmation and exact targets.
- Keep rollback options until acceptance criteria are met and retirement is explicitly decided.

## Documentation style

- Write public documentation in English.
- Keep exact facts in tables when useful.
- Prefer portable paths and placeholders over private machine-specific values.
- Link related documents using relative Markdown links.
- Update `docs/current-state.md` and `docs/roadmap.md` when implementation status changes.
- Add an ADR under `docs/decisions/` for durable architectural choices.
- Keep operational commands copy-safe and label any command that can modify state.

## Git workflow

Use a risk-based workflow. A branch is a safety tool, not a mandatory ceremony.

### Routine Sync Lane — direct to `main` allowed

Direct commits to the default branch are allowed for small, deterministic, easily reversible synchronization of already verified reality, including:

- updating this workstream's owned `.project/...yaml` state after a meaningful verified milestone;
- synchronizing `docs/current-state.md`, `docs/roadmap.md`, milestone notes, or other status documentation to verified reality;
- correcting small documentation errors, links, wording, or metadata;
- low-risk documentation-only cleanup that does not change live infrastructure or executable configuration.

Routine Sync Lane must not be used for Docker/Compose behavior changes, scripts, package changes, filesystem/network configuration, credentials handling, deployment behavior, destructive operations, major architecture decisions, or any ambiguous change.

### Change / Review Lane — branch + PR required

Use a dedicated branch and pull request when the change has meaningful operational, implementation, security, or review risk, including:

- Docker/Compose or executable configuration changes;
- scripts or automation changes;
- storage/filesystem/network design changes;
- security, permissions, secrets-management or remote-access changes;
- package/dependency changes;
- destructive or hard-to-reverse changes;
- major architecture changes, ADR-worthy changes, or broad refactors.

Keep unrelated changes out of the branch. Validate links, run applicable tests/checks, and run secret scans where relevant before merge.

### Branch lifecycle ownership

If you create a branch, you own its lifecycle.

- If Igor has already approved the intended change, do not ask for a second approval merely to merge the resulting PR.
- After applicable checks pass and the implemented scope still matches the approved change, merge the PR as part of completing the task.
- Prefer squash merge unless there is a reason to preserve individual commits.
- Delete the merged branch when the available GitHub tooling supports branch deletion.
- If branch deletion is unavailable, explicitly report the leftover merged branch instead of silently leaving cleanup to Igor.
- Do not merge if checks fail, the scope materially changed, or new consequential risk appeared; surface that instead.
- Use draft PRs only for genuinely unfinished work, not by default.

## Project State rules

In a multi-workstream repository, each specialist writes only its assigned workstream state under `.project/workstreams/`. The root `.project/state.yaml` is a project rollup and must not be overwritten by a specialist workstream.

Meaningful verified milestones should synchronize the owned Project State as part of milestone closure. Ordinary discussion, brainstorming, and failed experiments that do not change verified reality do not require a state write.
