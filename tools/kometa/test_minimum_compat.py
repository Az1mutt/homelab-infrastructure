"""Execute the pinned Kometa's actual collection gates with an in-memory Plex boundary.

Run inside the pinned image with KOMETA_SOURCE=/kometa.py and network disabled.
AST extraction avoids importing Kometa's CLI (which starts application execution).
These are component tests, not live Plex acceptance.
"""
import ast
from collections import defaultdict
from datetime import date
import os
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import Mock

from discovery import build
from test_discovery import movie


@unittest.skipUnless(os.environ.get('KOMETA_SOURCE'), 'requires pinned Kometa source')
class MinimumCompatibilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tree = ast.parse(Path(os.environ['KOMETA_SOURCE']).read_text())
        helpers = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in
                   ('should_sync_collection', 'collection_count_after_run')]
        assert len(helpers) == 2, 'Pinned Kometa helper contract changed'
        # Select the actual add/sync and final minimum branches, not a reimplementation.
        statements = {}
        for n in ast.walk(tree):
            if isinstance(n, ast.If):
                test = ast.unparse(n.test)
                if test == 'len(builder.found_items) > 0 and len(builder.found_items) + builder.beginning_count >= builder.minimum and builder.build_collection':
                    statements['add'] = n
                elif test == 'should_sync_collection(builder)':
                    statements['sync'] = n
                elif test == 'builder.build_collection and (not builder.blank_collection) and (final_collection_count < builder.minimum)':
                    statements['minimum'] = n
        assert set(statements) == {'add', 'sync', 'minimum'}, 'Pinned collection gates changed'
        setup = ast.parse('items_added = 0\nitems_removed = 0').body
        count = ast.parse('valid = True\nfinal_collection_count = collection_count_after_run(builder.beginning_count, items_added, items_removed)').body
        module = ast.Module(body=helpers + setup + [statements['add'], statements['sync']] + count + [statements['minimum']], type_ignores=[])
        cls.code = compile(ast.fix_missing_locations(module), '<pinned Kometa collection gates>', 'exec')

    def setUp(self):
        self.definition = build([movie(i) for i in range(6)], date(2026, 10, 16), {})[0]['collections']['Trending Now']

    def run_day(self, existing, matches, delete=None):
        members = set(existing or [])
        found = set(matches)
        builder = SimpleNamespace(
            found_items=list(found), beginning_count=len(members),
            minimum=self.definition['minimum_items'], build_collection=True,
            blank_collection=False, sync=True, remove_item_map=members - found,
            obj=existing is not None, Type='Collection',
            details={'delete_below_minimum': self.definition['delete_below_minimum'] if delete is None else delete})

        def add():
            added, unchanged = len(found - members), len(found & members)
            members.update(found)
            builder.obj = True
            return added, unchanged

        def sync():
            removed = len(members - found)
            members.intersection_update(found)
            return removed

        def remove():
            builder.obj = False
            members.clear()
            return 'Deleted'

        builder.add_to_collection, builder.sync_collection, builder.delete = add, sync, remove
        library = SimpleNamespace(stats=defaultdict(int), status={'Trending Now': {}})
        context = dict(builder=builder, library=library, logger=Mock(), mapping_name='Trending Now')
        exec(self.code, context)
        return members if builder.obj else None

    def test_at_least_three_creates_collection(self):
        for count in (3, 4, 12):
            with self.subTest(count=count):
                self.assertEqual(self.run_day(None, range(count)), set(range(count)))

    def test_below_minimum_deletes_existing_and_omits_new(self):
        for count in (0, 1, 2):
            for existing in (None, {0, 1, 2}):
                with self.subTest(count=count, existing=existing):
                    self.assertIsNone(self.run_day(existing, range(count)))

    def test_recovery_recreates_collection(self):
        existing = self.run_day(None, {1, 2, 3})
        existing = self.run_day(existing, {1})
        self.assertIsNone(existing)
        self.assertEqual(self.run_day(existing, {1, 4, 5}), {1, 4, 5})

    def test_old_policy_reproduces_oct15_defect(self):
        self.assertEqual(self.run_day({1, 2, 3}, {1}, delete=False), {1})

    def test_only_trending_enables_deletion(self):
        collections = build([movie(i) for i in range(6)], date(2026, 10, 16), {})[0]['collections']
        self.assertEqual([name for name, c in collections.items() if c['delete_below_minimum']], ['Trending Now'])


if __name__ == '__main__':
    unittest.main()
