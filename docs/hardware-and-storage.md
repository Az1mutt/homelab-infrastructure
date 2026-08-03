# Hardware and Storage

## Current laptop host

| Field | State |
|---|---|
| Model | Lenovo Legion Y720-15IKB |
| Role | Current temporary Docker media host |
| OS | Ubuntu; exact version unknown |
| CPU / RAM / GPU | Not yet captured for the repository |
| Migration rule | Keep operational until desktop acceptance and rollback are complete |

## Target desktop inventory

| Component | Current evidence | Status |
|---|---|---|
| Chassis | Older standard desktop tower | Exact model and drive capacity unknown |
| Motherboard | ASUS, Intel LGA1155 platform | Exact model unknown |
| CPU | Intel Core i5 family | Exact model unknown |
| RAM | No verified inventory | Unknown |
| GPU | No dedicated GPU confirmed | Unknown |
| Expansion | PCIe slots appear available | Requires boot and visual verification |
| PSU | EVOLVE 500ATX, labelled 500 W | Installed; long-term reliability risk |
| Network | PCIe Wi-Fi adapter with Intel AX200/AX210 discussed | Not acquired or installed |

The target's exact configuration must be collected after a safe boot. Photographic inference is not a substitute for `dmidecode`, `lscpu`, `lspci`, memory inventory, and board identification.

## Existing system disk

| Field | Current knowledge |
|---|---|
| Type | HDD |
| Nominal capacity | Approximately 1 TB, user-reported |
| Previously visible capacity | Approximately 100 GB |
| Model / serial | Unknown; serial must remain private |
| Partition table / filesystem | Unknown |
| SMART status | Unknown |
| Planned role | Temporary Ubuntu, Docker, appdata, metadata, and logs |

The 1 TB versus 100 GB discrepancy may be caused by partitioning, unallocated space, a different observed device, or damage. No explanation is accepted until read-only inspection is performed.

## Acquired data disk

| Field | Current knowledge |
|---|---|
| Model | Toshiba MG09ACA18TE |
| Capacity | 18 TB |
| Interface | SATA 6 Gb/s |
| Class | 7200 RPM enterprise CMR HDD, helium-filled |
| Manufacturing date | 2021-08-30 |
| Seller-supplied power-on hours | Approximately 21,844 hours |
| Seller-supplied power cycles | Approximately 256 |
| Critical SMART media attributes | No reallocations, pending sectors, or offline uncorrectable sectors in seller evidence |
| Historical UDMA CRC count | Approximately 8; record as baseline and monitor |
| Current state | Acquired and physically at home; not locally accepted |
| Planned role | Bulk media and download data; broader use requires a backup policy |

Seller-supplied SMART evidence matched the acquired disk and was encouraging. It is not equivalent to a local acceptance test.

## Required disk acceptance sequence

1. Securely mount or safely stage the disks.
2. Record model, capacity, firmware, partitions, filesystem, and SMART data locally.
3. Run an extended SMART self-test on the 18 TB disk.
4. Run a full-surface read test.
5. Compare the UDMA CRC count before and after testing with a known-good SATA cable.
6. Decide on destructive burn-in only while the disk is empty and only with explicit approval.
7. Select the filesystem and mount paths.
8. Mount persistently by UUID or filesystem label.
9. Reboot and verify mounts before placing data on the disk.

## Physical safety

The chassis may provide multiple 3.5-inch positions, but the secure capacity and correct rail or bracket system are not verified.

Do not operate disks permanently:

- loose on the case floor;
- stacked directly on one another;
- with the controller PCB touching metal;
- with power or data cables under tension;
- without adequate airflow.

## Storage is not backup

A single 18 TB disk provides capacity, not redundancy or backup. Irreplaceable photos, documents, databases, configuration, and repositories require an independent copy. Replaceable media can use a different recovery priority.

No RAID, mirror, parity, SnapRAID, ZFS, or second large backup disk is currently implemented.

