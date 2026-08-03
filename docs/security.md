# Security

This is a public repository describing private infrastructure. Documentation must remain useful without becoming an access map.

## Never publish

- passwords, tokens, API keys, session cookies, or private keys;
- `.env` files or resolved Compose output containing environment values;
- Plex, TMDb, SABnzbd, indexer, Usenet, or VPN credentials;
- public IP addresses or router-management details;
- unnecessary private LAN addresses, hostnames, MAC addresses, or SSIDs;
- disk serial numbers;
- invoices, order numbers, email addresses, or account identifiers;
- unsanitized logs, screenshots, database files, backups, or configuration archives.

## Safe examples

Use placeholders:

```text
<HOST_LAN_IP>
<PLEX_TOKEN>
<TMDB_API_KEY>
<SABNZBD_API_KEY>
<INDEXER_API_KEY>
<USENET_USERNAME>
<USENET_PASSWORD>
```

Examples must use dummy values that cannot authenticate to any system.

## Configuration workflow

1. Copy the live file to a temporary location.
2. Replace all secrets and private identifiers with placeholders.
3. Inspect URLs, comments, mounted paths, hostnames, and embedded credentials.
4. Validate that the sanitized file still documents the intended structure.
5. Run a secret scan.
6. Review the complete diff before committing.

Do not use `docker compose config` output as a public artifact without review because it may resolve environment variables into plaintext.

## Service exposure

- Current documentation assumes LAN-only service access.
- No public port forwarding, reverse proxy, or internet exposure is documented.
- Any future remote access should use an explicitly designed and documented secure method.
- Avoid wildcard host allowlists when a specific service hostname is sufficient.
- Authentication and firewall state must be verified before describing the deployment as hardened.

## Operational permissions

Observed world-writable Kometa paths suggest that ownership and file modes require review. Do not apply recursive ownership or permission changes without understanding container UID/GID mappings and the exact target paths.

## Incident-aware design

The project has a history of accidental media deletion. Security therefore includes protection against operator error:

- least-privilege access;
- exact command targets;
- backups before migration;
- copy-and-verify before deletion;
- rollback points;
- explicit approval for destructive disk operations.

