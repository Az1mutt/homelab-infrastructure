# ADR 001: Use Ubuntu Server 24.04 LTS

- **Status:** Accepted, not yet implemented
- **Date:** 2026-08-03

## Context

The target desktop will run a long-lived, headless homelab. The workload is primarily containerized and exposes browser-based interfaces. The project should also build transferable Linux, Docker, storage, networking, and automation skills.

Ubuntu Server, Ubuntu Desktop, and Unraid were considered.

## Decision

Use **Ubuntu Server 24.04 LTS without a graphical desktop** for the initial target installation.

Normal administration will use SSH from another computer. A local monitor and keyboard may be used for installation and recovery.

## Rationale

- Appropriate for a headless server workload.
- Strong Docker ecosystem and documentation.
- Long-term support lifecycle.
- Lower unnecessary desktop overhead.
- Encourages reproducible command-line administration.
- Preserves the option to add a graphical environment later if a concrete need appears.

## Alternatives

### Unraid

Unraid offers convenient mixed-disk expansion and web management. It was not selected because the current objective includes learning and documenting transferable Linux and infrastructure practices.

### Ubuntu Desktop

Ubuntu Desktop could simplify local graphical administration. It was not selected because the planned services are browser-managed and the server should normally operate headlessly.

## Consequences

- SSH access and recovery procedures are mandatory.
- Hardware, storage, firewall, and service management must be documented explicitly.
- No claim may be made about the installed OS until installation evidence is recorded.
- A desktop environment can be reconsidered if a real workload requires it.

