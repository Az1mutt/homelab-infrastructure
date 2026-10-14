#!/usr/bin/env python3
"""Accepted bounded runner, extended to the five Movies discovery collections.

The Phase 1 filename/lock/container identity remain stable for the existing cron.
"""
import datetime
import fcntl
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path('/data/docker/kometa')
NAME = 'kometa-phase1-job'
DOCKER = '/usr/bin/docker'


def main():
    os.umask(0o077)
    with (ROOT / 'phase1.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Kometa Phase 1 already running', flush=True)
            return 0
        if subprocess.run([DOCKER, 'inspect', NAME], capture_output=True).returncode == 0:
            print('Existing Phase 1 container requires inspection; refusing overlap', flush=True)
            return 1
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        log_path = ROOT / 'logs' / ('phase1-' + stamp + '.log')
        command = [DOCKER, 'compose', '-f', '/data/docker/docker-compose.yml',
                   '-f', str(ROOT / 'compose.phase1.yml'), 'run', '--no-deps',
                   '--pull', 'never', '-d', '--name', NAME, '--entrypoint', 'python',
                   'kometa', '/config/discovery.py', '--run-kometa']
        with log_path.open('w') as log:
            started = subprocess.run(command, stdout=log, stderr=log, timeout=120)
            if started.returncode:
                print('Kometa launch failed; inspect ' + str(log_path), flush=True)
                return started.returncode
            result = 1
            try:
                waited = subprocess.run([DOCKER, 'wait', NAME], capture_output=True,
                                        text=True, timeout=1800)
                if waited.returncode == 0:
                    result = int(waited.stdout.strip())
            except subprocess.TimeoutExpired:
                result = 124
            finally:
                # This is exclusively the container created above; media is never removed.
                subprocess.run([DOCKER, 'stop', '-t', '30', NAME], stdout=log, stderr=log, timeout=60)
                subprocess.run([DOCKER, 'logs', NAME], stdout=log, stderr=log, timeout=60)
                subprocess.run([DOCKER, 'rm', NAME], stdout=log, stderr=log, timeout=60)
            print('Kometa Phase 1 exit=' + str(result) + '; private log=' + str(log_path), flush=True)
            return result


if __name__ == '__main__':
    sys.exit(main())
