"""Compose an explicit staged release without changing the native source tree.

The approved first stage updates auth/alarm/automation/notification while the
device directory still belongs to the deployed Community service. Only the
reviewed device files come from the pinned deployed revision. This is a build
composition, not runtime API fallback. The output records both source revisions.
"""
import hashlib
import io
import json
import pathlib
import subprocess
import sys
import tarfile

BASELINE = 'a46f1dd8866b3c7d89328c0bc7b722e46c703581'


def compose(repo, destination):
    repo, destination = pathlib.Path(repo).resolve(), pathlib.Path(destination).resolve()
    if destination.exists():
        raise ValueError('Build destination must not already exist')
    if destination == repo or repo in destination.parents:
        raise ValueError('Build output must be outside the source checkout')
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=str(repo))
    head = git('rev-parse', 'HEAD').decode().strip()
    spec = json.loads((repo / 'deploy/community-test/control-plane-device-files.json').read_text(encoding='utf-8'))
    if spec['baseline'] != BASELINE:
        raise ValueError('Unreviewed device baseline')
    records = []
    staged = {}
    for name in spec['files']:
        path = pathlib.PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or not (
            name.startswith('src/views/device/') or name == 'src/components/thingsvis/ThingsVisWidget.vue'
        ):
            raise ValueError('Device overlay escapes approved scope')
        if name.endswith('give-an-alarm.vue') or name.endswith('/alarm-info.vue'):
            raise ValueError('The new alarm entry must be retained')
        data = git('show', BASELINE + ':' + name)
        staged[name] = data
        records.append({'path': name, 'sha256': hashlib.sha256(data).hexdigest()})
    archive = git('archive', '--format=tar', head)
    destination.mkdir(parents=True)
    with tarfile.open(fileobj=io.BytesIO(archive)) as tf:
        for member in tf.getmembers():
            p = pathlib.PurePosixPath(member.name)
            if p.is_absolute() or '..' in p.parts or not (member.isfile() or member.isdir()):
                raise ValueError('Unsafe source archive')
        tf.extractall(str(destination))
    for name, data in staged.items():
        path = destination / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    profile = {'profile': 'control-plane', 'source_commit': head,
               'device_source_commit': BASELINE, 'device_owner': 'community',
               'upgraded_modules': ['authentication', 'alarms', 'automation', 'notification'],
               'overrides': records}
    (destination / 'public/RELEASE_PROFILE.json').write_text(json.dumps(profile, indent=2), encoding='utf-8')
    return profile


if __name__ == '__main__':
    result = compose(sys.argv[1], sys.argv[2])
    print(json.dumps({'profile': result['profile'], 'source_commit': result['source_commit'],
                      'device_source_commit': BASELINE, 'device_files': len(result['overrides'])}))
