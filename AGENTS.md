# AGENTS.md

## Repository purpose

This is a public documentation repository for a real homelab. Work must preserve factual accuracy, operational safety, and privacy.

## Source-of-truth rules

1. Distinguish the **current laptop host** from the **target desktop server**.
2. Use these status labels consistently:
   - **Verified**: supported by user confirmation, command output, logs, screenshots, or direct inspection.
   - **Component-tested**: an integration test passed, but the complete workflow did not.
   - **Planned**: selected or intended but not implemented.
   - **Blocked**: cannot proceed because a prerequisite is missing.
   - **Unknown**: insufficient evidence; do not infer a value.
   - **Historical**: describes an earlier event, not the current configuration.
3. A newer explicitly confirmed state overrides an older handoff. In particular, Eweka is active and SABnzbd is running and component-tested; older notes describing them as postponed or absent are obsolete.
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
- Keep the laptop stack intact until target acceptance criteria and rollback are documented.

## Documentation style

- Write public documentation in English.
- Keep exact facts in tables when useful.
- Prefer portable paths and placeholders over private machine-specific values.
- Link related documents using relative Markdown links.
- Update `docs/current-state.md` and `docs/roadmap.md` when implementation status changes.
- Add an ADR under `docs/decisions/` for durable architectural choices.
- Keep operational commands copy-safe and label any command that can modify state.

## Git workflow

- Work on a dedicated branch created from the latest default branch.
- Keep unrelated changes out of the branch.
- Validate Markdown links and run a secret scan before committing.
- Open a draft pull request for review.
- Do not merge a pull request unless the user explicitly asks for a merge.

