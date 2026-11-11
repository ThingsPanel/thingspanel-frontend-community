"""Verify, switch and health-check the community test frontend (Python 3.6+)."""
import fcntl
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tarfile
import time
import urllib.request

ROOT = pathlib.Path('/opt/tp-community-actions')
TARGET = pathlib.Path('/home/thingspanel/nginx/www/dist')
SHA = sys.argv[1]
if not re.fullmatch('[0-9a-f]{40}', SHA):
    raise SystemExit('Invalid source revision')
os.umask(0o077)
ROOT.mkdir(mode=0o700, exist_ok=True)
lock = (ROOT / 'deployment.lock').open('a')
fcntl.flock(lock, fcntl.LOCK_EX)
preflight = ROOT / 'incoming/rollout_preflight.py'
if not preflight.is_file():
    raise RuntimeError('Matching backend rollout prerequisite checker is not installed; deploy backend prerequisites first')
subprocess.check_call([sys.executable, str(preflight)])
release = ROOT / 'frontend-releases' / SHA
reuse = release.exists()
if reuse:
    record = release / 'deployment.json'
    if not record.is_file() or json.loads(record.read_text()).get('commit') != SHA:
        raise SystemExit('Incomplete release exists; inspect its result before retrying')
release.mkdir(parents=True, mode=0o755, exist_ok=True)
# Nginx workers need to traverse this directory to serve public static assets.
release.parent.chmod(0o755)
ROOT.chmod(0o755)
site = release / 'site'
site.mkdir(mode=0o755, exist_ok=True)
release.chmod(0o755)
site.chmod(0o755)
package = ROOT / 'incoming' / ('frontend-' + SHA + '.tar.gz')
if not reuse:
  with tarfile.open(str(package)) as archive:
    for member in archive.getmembers():
        dest = (site / member.name).resolve()
        if (member.issym() or member.islnk() or not (member.isfile() or member.isdir())
                or not str(dest).startswith(str(site.resolve()) + '/')):
            raise RuntimeError('Unsafe bundle entry')
    archive.extractall(str(site))
manifest = json.loads((site / 'manifest.json').read_text())
if manifest['commit'] != SHA or (site / 'SOURCE_COMMIT').read_text().strip() != SHA:
    raise RuntimeError('Source revision mismatch')
for name, expected in manifest['sha256'].items():
    path = site / name
    if not str(path.resolve()).startswith(str(site.resolve()) + '/'):
        raise RuntimeError('Unsafe manifest path')
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise RuntimeError('Bundle checksum mismatch')
for path in site.rglob('*'):
    path.chmod(0o755 if path.is_dir() else 0o644)
if not (site / 'index.html').is_file():
    raise RuntimeError('Missing frontend entry')
mini_entry = site / 'mp-device' / 'index.html'
if not mini_entry.is_file() or 'id="mp-device"' not in mini_entry.read_text():
    raise RuntimeError('Missing mini-program device entry')
subprocess.check_call(['nginx', '-t'])
if not TARGET.exists():
    raise RuntimeError('Existing frontend required for rollback')
previous = os.readlink(str(TARGET)) if TARGET.is_symlink() else None
backup = TARGET.with_name('dist.before-actions-' + SHA)
link = TARGET.with_name('dist.next-' + SHA)
if (previous is None and backup.exists()) or os.path.lexists(str(link)):
    raise RuntimeError('Deployment paths already exist')


def switch(destination):
    os.symlink(str(destination), str(link))
    os.replace(str(link), str(TARGET))


def fetch(path):
    request = urllib.request.Request('http://127.0.0.1/' + path,
                                     headers={'Host': 'c.thingspanel.cn', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=10) as response:
        return response.read()


try:
    if previous is None:
        os.rename(str(TARGET), str(backup))
    switch(site)
    for attempt in range(10):
        try:
            if (fetch('SOURCE_COMMIT').decode().strip() == SHA
                    and fetch('index.html') == (site / 'index.html').read_bytes()
                    and fetch('mp-device/index.html') == mini_entry.read_bytes()):
                break
        except Exception:
            pass
        time.sleep(1)
    else:
        raise RuntimeError('HTTP source revision or entry verification failed')
except Exception:
    if previous is not None:
        switch(previous)
    elif backup.exists():
        if TARGET.is_symlink():
            TARGET.unlink()
        os.rename(str(backup), str(TARGET))
    (release / 'rollback.json').write_text(json.dumps({'restored': True}))
    raise
(release / 'deployment.json').write_text(json.dumps({'commit': SHA, 'previous': previous or str(backup)}))
print('Frontend deployed and HTTP verified: ' + SHA)
