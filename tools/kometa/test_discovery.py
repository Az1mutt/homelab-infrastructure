"""Pure rotation/definition tests; no network, Plex or private configuration."""
from datetime import date, timedelta
import unittest

from discovery import build, choose_movie, choose_spotlight, eligible_movies, EPOCH


def movie(key, director='Martin Scorsese', genre='Crime'):
    return {'id': str(key), 'identity': 'imdb://test' + str(key), 'title': 'Fixture ' + str(key),
            'release': '2020-01-01', 'playable': True,
            'directors': [director], 'genres': [genre]}


class DiscoveryTests(unittest.TestCase):
    def test_five_definitions_exact_one_daily_and_order(self):
        definitions, state = build([movie(i) for i in range(1, 7)], date(2026, 10, 14), {})
        cs = definitions['collections']
        self.assertEqual(len(cs), 5)
        self.assertEqual(len(cs['Movie of the Day']['plex_rating_key']), 1)
        self.assertEqual([c['sort_title'][:4] for c in cs.values()],
                         ['!010', '!020', '!030', '!040', '!050'])
        self.assertEqual(cs['Newly Released']['smart_filter']['any'], {'release': 90})
        self.assertEqual(cs['Trending Now']['tmdb_trending_weekly'], 100)
        self.assertEqual(cs['Trending Now']['minimum_items'], 3)
        self.assertTrue(all(c['sync_mode'] == 'sync' for c in cs.values()))
        self.assertTrue(all(not any(k.startswith(('radarr', 'sonarr', 'visible_')) for k in c)
                            for c in cs.values()))

    def test_same_day_persists_despite_library_additions_and_order(self):
        movies = [movie(i) for i in range(1, 7)]
        day = date(2026, 10, 14)
        first, state = build(movies, day, {})
        second, _ = build(list(reversed(movies)) + [movie(i) for i in range(7, 100)], day, state)
        self.assertEqual(first['collections']['Movie of the Day']['plex_rating_key'],
                         second['collections']['Movie of the Day']['plex_rating_key'])

    def test_daily_is_reproducible_without_state_and_can_rotate(self):
        movies = [movie(i) for i in range(1, 20)]
        picks = []
        for n in range(7):
            day = EPOCH + timedelta(days=n)
            a = choose_movie(movies, day, {})
            self.assertEqual(a, choose_movie(list(reversed(movies)), day, {}))
            picks.append(a['id'])
        self.assertGreater(len(set(picks)), 1)

    def test_removed_daily_movie_gets_eligible_replacement(self):
        day = EPOCH
        previous = {'day': day.isoformat(), 'identity': movie(1)['identity']}
        self.assertEqual(choose_movie([movie(2)], day, previous)['id'], '2')

    def test_weekly_pool_skips_shallow_director(self):
        movies = [movie(i, 'Deep') for i in range(1, 4)] + [movie(4, 'Shallow')]
        name, members, week = choose_spotlight(movies, ['Shallow', 'Deep'], 'directors', 3, EPOCH, 0, {})
        self.assertEqual(name, 'Deep')
        self.assertEqual(len(members), 3)
        self.assertEqual(week, 0)

    def test_weekly_cadence_and_genre_offset(self):
        movies = [movie(i, 'A', 'A') for i in range(1, 6)] + [movie(i, 'B', 'B') for i in range(6, 11)]
        self.assertEqual(choose_spotlight(movies, ['A', 'B'], 'directors', 3, EPOCH, 0, {})[0], 'A')
        self.assertEqual(choose_spotlight(movies, ['A', 'B'], 'directors', 3, EPOCH + timedelta(days=7), 0, {})[0], 'B')
        self.assertEqual(choose_spotlight(movies, ['A', 'B'], 'genres', 5, EPOCH + timedelta(days=2), 3, {})[0], 'B')
        self.assertEqual(choose_spotlight(movies, ['A', 'B'], 'genres', 5, EPOCH + timedelta(days=3), 3, {})[0], 'A')

    def test_weekly_selection_stays_during_week(self):
        movies = [movie(i, 'A') for i in range(1, 4)] + [movie(i, 'B') for i in range(4, 7)]
        result = choose_spotlight(movies, ['A', 'B'], 'directors', 3, EPOCH, 0, {'week': 0, 'name': 'B'})
        self.assertEqual(result[0], 'B')

    def test_does_not_weaken_minimum_or_include_unreleased(self):
        movies = [movie(1), movie(2)]
        with self.assertRaises(ValueError):
            choose_spotlight(movies, ['Martin Scorsese'], 'directors', 3, EPOCH, 0, {})
        movies[0]['release'] = '2099-01-01'
        movies[1]['playable'] = False
        self.assertEqual(eligible_movies(movies, EPOCH), [])


if __name__ == '__main__':
    unittest.main()
