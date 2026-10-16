#!/usr/bin/env python3
"""Generate the bounded Movies discovery file, then optionally execute Kometa.

Runs inside the pinned Kometa image. Credentials are read only from its existing
config; generated definitions/state contain no credentials or account identifiers.
"""
import argparse
from datetime import date, datetime, timedelta
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ROOT = Path('/config')
DIRECTORS = ['Martin Scorsese', 'Denis Villeneuve', 'David Fincher',
             'Christopher Nolan', 'Quentin Tarantino', 'Danny Boyle',
             'Steven Spielberg', 'Bong Joon-ho']
GENRES = ['Crime', 'Horror', 'Science Fiction', 'Thriller', 'Drama', 'Comedy']
TITLES = ['Newly Released', 'Trending Now', 'Movie of the Day',
          'Director Spotlight', 'Genre Spotlight']
EPOCH = date(2026, 1, 5)  # Monday; local calendar dates, independent of DST.


def movie_identity(movie):
    return movie['identity']


def eligible_movies(movies, today):
    return [m for m in movies if m['playable'] and m['release']
            and m['release'] <= today.isoformat()]


def choose_movie(movies, today, previous):
    if not movies:
        raise ValueError('No released playable library movie is eligible')
    if previous.get('day') == today.isoformat():
        retained = next((m for m in movies if m['identity'] == previous.get('identity')), None)
        if retained:
            return retained
    # A stable daily ranking, not random Plex ordering. Persist the winner so
    # additions to the library cannot change the choice during the same day.
    return min(movies, key=lambda m: (hashlib.sha256(
        (today.isoformat() + '|' + movie_identity(m)).encode()).hexdigest(), m['id']))


def choose_spotlight(movies, pool, field, minimum, today, offset, previous):
    week = (today - EPOCH - timedelta(days=offset)).days // 7
    members = {name: [m for m in movies if name in m[field]] for name in pool}
    retained = previous.get('name')
    if (previous.get('week') == week and retained in members
            and len(members[retained]) >= minimum):
        return retained, members[retained], week
    for step in range(len(pool)):
        name = pool[(week + step) % len(pool)]
        if len(members[name]) >= minimum:
            return name, members[name], week
    raise ValueError('No eligible ' + field + ' spotlight meets minimum ' + str(minimum))


def build(movies, today, previous):
    movies = eligible_movies(movies, today)
    motd = choose_movie(movies, today, previous.get('movie', {}))
    director, director_movies, director_week = choose_spotlight(
        movies, DIRECTORS, 'directors', 3, today, 0, previous.get('director', {}))
    genre, genre_movies, genre_week = choose_spotlight(
        movies, GENRES, 'genres', 5, today, 3, previous.get('genre', {}))
    definitions = {
        'Newly Released': {
            'smart_filter': {'sort_by': 'release.desc', 'any': {'release': 90}},
            'summary': 'A collection of newly-released movies.',
            'minimum_items': 1, 'ignore_blank_results': True,
        },
        'Trending Now': {
            'tmdb_trending_weekly': 100, 'limit': 12, 'minimum_items': 3,
            'collection_order': 'custom',
            'summary': 'Currently trending on TMDb this week, available in this library. Up to 12 matches from the top 100; never padded.',
        },
        'Movie of the Day': {
            'plex_rating_key': [int(motd['id'])], 'minimum_items': 1,
            'collection_order': 'release.desc',
            'summary': 'One daily pick from released library movies. Fixed for the Bratislava calendar day; independent of watched history.',
        },
        'Director Spotlight': {
            'plex_rating_key': [int(m['id']) for m in director_movies],
            'minimum_items': 3, 'collection_order': 'release.desc',
            'summary': 'This week: ' + director + '. A curated director focus, reviewed each Monday; at least three local movies.',
        },
        'Genre Spotlight': {
            'plex_rating_key': [int(m['id']) for m in genre_movies],
            'minimum_items': 5, 'collection_order': 'release.desc',
            'summary': 'This week: ' + genre + '. A curated genre focus, reviewed each Thursday; at least five local movies.',
        },
    }
    for index, (title, definition) in enumerate(definitions.items(), 1):
        definition.update({'sort_title': '!' + str(index * 10).zfill(3) + '_' + title,
                           'sync_mode': 'sync', 'delete_below_minimum': title == 'Trending Now',
                           'delete_not_scheduled': False,
                           'label': ['Kometa', 'Kometa v2']})
    state = {'movie': {'day': today.isoformat(), 'identity': motd['identity'], 'title': motd['title']},
             'director': {'week': director_week, 'name': director},
             'genre': {'week': genre_week, 'name': genre}}
    return {'collections': definitions}, state


def read_movies(config):
    def get(path):
        request = urllib.request.Request(config['plex']['url'].rstrip('/') + path,
                                         headers={'X-Plex-Token': config['plex']['token']})
        with urllib.request.urlopen(request, timeout=30) as response:
            return ET.fromstring(response.read())
    libraries = [x for x in get('/library/sections')
                 if x.get('title') == 'Movies' and x.get('type') == 'movie']
    if len(libraries) != 1:
        raise ValueError('Expected exactly one Movies movie library')
    result = []
    for m in get('/library/sections/' + libraries[0].get('key') + '/all?type=1&includeGuids=1'):
        guids = [g.get('id') for g in m.findall('Guid')]
        identity = next((g for g in guids if g.startswith('imdb://')), m.get('guid'))
        if not identity:
            identity = 'ratingKey:' + m.get('ratingKey')
        result.append({'id': m.get('ratingKey'), 'identity': identity, 'title': m.get('title'),
                       'release': m.get('originallyAvailableAt'),
                       'playable': m.find('Media/Part') is not None,
                       'directors': [x.get('tag') for x in m.findall('Director')],
                       'genres': [x.get('tag') for x in m.findall('Genre')]})
    return result


def atomic_json(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    if os.geteuid() == 0:
        owner = (ROOT / 'config.yml').stat()
        os.chown(temporary, owner.st_uid, owner.st_gid)
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run-kometa', action='store_true')
    args = parser.parse_args()
    os.umask(0o077)
    from ruamel.yaml import YAML  # Supplied by pinned Kometa; no host dependency.
    try:
        config = YAML(typ='safe').load((ROOT / 'config.yml').read_text())
        # No acquisition integration is needed. Fail closed if one is introduced
        # into this dedicated config later rather than inheriting add-missing defaults.
        movie_config = config.get('libraries', {}).get('Movies', {})
        if any(config.get(s) or movie_config.get(s) for s in ['radarr', 'sonarr']):
            raise ValueError('Discovery config must not enable acquisition integrations')
        state_path = ROOT / 'movies-v2.rotation.json'
        previous = json.loads(state_path.read_text()) if state_path.exists() else {}
        today = datetime.now(ZoneInfo('Europe/Bratislava')).date()
        definitions, state = build(read_movies(config), today, previous)
        atomic_json(ROOT / 'movies-v2.generated.yml', definitions)
        atomic_json(state_path, state)
    except Exception as error:
        # HTTP/YAML exceptions can embed secret URLs/config; never print their values.
        print('Discovery preparation failed safely: ' + type(error).__name__, flush=True)
        return 1
    print('Discovery prepared: ' + json.dumps(state), flush=True)
    if args.run_kometa:
        completed = subprocess.run([sys.executable, '/kometa.py', '--run',
                 '--run-libraries', 'Movies', '--run-files', 'movies-v2.generated',
                 '--run-collections', '|'.join(TITLES), '--collections-only'])
        if completed.returncode:
            return completed.returncode
        # Kometa 2.4.8 can exit zero despite collection Service Errors.
        log = (ROOT / 'logs' / 'meta.log').read_text(errors='replace')
        if '[ERROR]' in log:
            print('Kometa reported errors; inspect the private log', flush=True)
            return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
