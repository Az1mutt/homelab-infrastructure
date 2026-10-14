"""Offline lifecycle tests; never invokes Docker or Plex."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('runner', Path(__file__).with_name('run_phase1.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class LifecycleTests(unittest.TestCase):
    def exercise(self, timeout=False, existing=False):
        calls = []
        def fake(args, **kwargs):
            calls.append(args)
            if args[1] == 'inspect':
                return subprocess.CompletedProcess(args, 0 if existing else 1)
            if args[1] == 'wait':
                if timeout:
                    raise subprocess.TimeoutExpired(args, 1800)
                return subprocess.CompletedProcess(args, 0, '0\n')
            return subprocess.CompletedProcess(args, 0)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'logs').mkdir()
            with patch.object(runner, 'ROOT', root), patch.object(runner.subprocess, 'run', fake):
                result = runner.main()
        return result, calls

    def test_success_cleans_only_owned_container(self):
        result, calls = self.exercise()
        self.assertEqual(result, 0)
        self.assertEqual([c[1] for c in calls][-3:], ['stop', 'logs', 'rm'])
        self.assertTrue(all(c[-1] == runner.NAME for c in calls[-3:]))

    def test_timeout_stops_job_and_reports_failure(self):
        result, calls = self.exercise(timeout=True)
        self.assertEqual(result, 124)
        self.assertEqual([c[1] for c in calls][-3:], ['stop', 'logs', 'rm'])

    def test_existing_container_is_never_modified(self):
        result, calls = self.exercise(existing=True)
        self.assertEqual(result, 1)
        self.assertEqual(len(calls), 1)


if __name__ == '__main__':
    unittest.main()
