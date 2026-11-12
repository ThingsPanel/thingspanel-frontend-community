"""Verify, switch and health-check the community test frontend (Python 3.6+)."""
import fcntl
import hashlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request
import urllib.error

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


def asset_path(directory, name):
    path = directory / name
    if not re.fullmatch(r'assets/(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9.]+', name):
        return None
    if path.is_symlink() or not str(path.resolve()).startswith(str(directory.resolve()) + '/'):
        raise RuntimeError('Unsafe retained asset path')
    return path


def retain_previous_assets():
    # Only this manifest's original hashed assets are carried forward. Previously
    # retained assets are never copied recursively into later releases.
    retained = []
    prior_site = TARGET.resolve()
    record = prior_site.parent / 'deployment.json'
    prior_manifest_path = prior_site / 'manifest.json'
    if prior_site == site.resolve():
        return retained
    retention_file = release / 'retained-assets.json'
    if retention_file.is_file():
        for name in json.loads(retention_file.read_text()):
            stale = asset_path(site, name)
            if stale and name not in manifest['sha256'] and stale.is_file():
                stale.unlink()
    if not record.is_file() or not prior_manifest_path.is_file():
        return retained
    prior_manifest = json.loads(prior_manifest_path.read_text())
    prior_commit = json.loads(record.read_text()).get('commit')
    if not prior_commit or prior_manifest.get('commit') != prior_commit or (prior_site / 'SOURCE_COMMIT').read_text().strip() != prior_commit:
        raise RuntimeError('Previous release identity cannot be verified')
    for name, expected in prior_manifest['sha256'].items():
        source = asset_path(prior_site, name)
        if source is None:
            continue
        if hashlib.sha256(source.read_bytes()).hexdigest() != expected:
            raise RuntimeError('Previous asset checksum mismatch')
        destination = asset_path(site, name)
        if destination.exists():
            if hashlib.sha256(destination.read_bytes()).hexdigest() != expected:
                raise RuntimeError('Hashed asset name collision')
            continue
        destination.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
        try:
            os.link(str(source), str(destination))
        except OSError:
            shutil.copy2(str(source), str(destination))
        retained.append(name)
    retention_file.write_text(json.dumps(retained))
    return retained


retained_assets = retain_previous_assets()


def switch(destination):
    os.symlink(str(destination), str(link))
    os.replace(str(link), str(TARGET))


def fetch_info(path):
    request = urllib.request.Request('http://127.0.0.1/' + path,
                                     headers={'Host': 'c.thingspanel.cn', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=10) as response:
        return response.read(), response.headers


def fetch(path):
    return fetch_info(path)[0]


def verify_http_assets():
    for entry in ('index.html', 'device/thingsmodel/detail', 'mp-device/index.html'):
        body, headers = fetch_info(entry)
        if not any(token in headers.get('Cache-Control', '').lower() for token in ('no-cache', 'no-store')):
            raise RuntimeError('HTTP entry cache policy permits stale HTML')
        expected = mini_entry if entry.startswith('mp-device/') else site / 'index.html'
        if body != expected.read_bytes():
            raise RuntimeError('HTTP SPA entry mismatch')
    scripts = re.findall(r'(?:src|href)=["\'](/?assets/[^"\']+\.js)["\']', (site / 'index.html').read_text())
    if not scripts:
        raise RuntimeError('HTTP entry has no verifiable JavaScript asset')
    old_scripts = [name for name in retained_assets if name.endswith('.js')]
    for name in list(dict.fromkeys([item.lstrip('/') for item in scripts] + old_scripts[:1])):
        body, headers = fetch_info(name)
        if 'javascript' not in headers.get('Content-Type', '').lower() or body != (site / name).read_bytes():
            raise RuntimeError('HTTP JavaScript asset returned wrong MIME or content')
    try:
        fetch_info('assets/qa-missing-' + SHA + '.js')
    except urllib.error.HTTPError as error:
        if error.code == 404:
            if error.read() == (site / 'index.html').read_bytes():
                raise RuntimeError('HTTP missing JavaScript asset fell back to SPA HTML')
            return
        raise
    raise RuntimeError('HTTP missing JavaScript asset must return 404')


try:
    if previous is None:
        os.rename(str(TARGET), str(backup))
    switch(site)
    for attempt in range(10):
        try:
            if (fetch('SOURCE_COMMIT').decode().strip() == SHA
                    and fetch('index.html') == (site / 'index.html').read_bytes()
                    and fetch('mp-device/index.html') == mini_entry.read_bytes()):
                verify_http_assets()
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
