"""Exercise real directory switches in an isolated temporary server layout."""
import ast
import hashlib
import io
import json
import os
import pathlib
import sys
import tarfile
import tempfile
import unittest
from urllib.parse import urlparse
from unittest import mock


@unittest.skipUnless(os.name == 'posix', 'Deployment requires Linux filesystem semantics')
class DeploymentTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='tp-frontend-deploy-test-')
        self.addCleanup(self.temp.cleanup)
        self.base = pathlib.Path(self.temp.name)
        self.root = self.base / 'actions'
        self.incoming = self.root / 'incoming'
        self.incoming.mkdir(parents=True)
        self.target = self.base / 'www' / 'dist'
        self.target.mkdir(parents=True)
        (self.target / 'index.html').write_text('previous frontend')

    def bundle(self, sha, corrupt=False, missing_mini=False):
        files = {'index.html': b'new frontend', 'SOURCE_COMMIT': (sha + '\n').encode()}
        if not missing_mini:
            files['mp-device/index.html'] = b'<main id="mp-device"></main>'
        manifest = {'commit': sha, 'sha256': {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}}
        if corrupt:
            manifest['sha256']['index.html'] = '0' * 64
        files['manifest.json'] = json.dumps(manifest).encode()
        with tarfile.open(str(self.incoming / ('frontend-' + sha + '.tar.gz')), 'w:gz') as archive:
            for name, data in files.items():
                info = tarfile.TarInfo(name)
                info.size = len(data)
                archive.addfile(info, io.BytesIO(data))

    def deploy(self, sha, fail_http=False, mini_fallback=False):
        source = pathlib.Path(__file__).with_name('deploy_frontend.py').read_text()
        # Override only the two deployment roots; run all verification/switch logic.
        tree = ast.parse(source)
        replacements = {'/opt/tp-community-actions': str(self.root),
                        '/home/thingspanel/nginx/www/dist': str(self.target)}
        for node in ast.walk(tree):
            if isinstance(node, ast.Str) and node.s in replacements:
                node.s = replacements[node.s]
        namespace = {'__name__': '__main__'}

        def get(request, **kwargs):
            if fail_http:
                raise OSError('Simulated HTTP failure')
            filename = urlparse(request.full_url).path.lstrip('/')
            if mini_fallback and filename == 'mp-device/index.html':
                filename = 'index.html'
            return io.BytesIO((self.target / filename).read_bytes())

        with mock.patch.object(sys, 'argv', ['deploy_frontend.py', sha]), \
                mock.patch('subprocess.check_call'), mock.patch('urllib.request.urlopen', side_effect=get), \
                mock.patch('time.sleep'):
            try:
                exec(compile(tree, 'deploy_frontend.py', 'exec'), namespace)
            finally:
                if 'lock' in namespace:
                    namespace['lock'].close()

    def test_verified_release_replaces_directory_and_retains_backup(self):
        sha = 'a' * 40
        self.bundle(sha)
        self.deploy(sha)
        self.assertTrue(self.target.is_symlink())
        self.assertEqual((self.target / 'SOURCE_COMMIT').read_text().strip(), sha)
        backup = self.target.with_name('dist.before-actions-' + sha)
        self.assertEqual((backup / 'index.html').read_text(), 'previous frontend')
        self.assertEqual(self.target.resolve().stat().st_mode & 0o777, 0o755)

    def test_checksum_failure_leaves_existing_frontend_untouched(self):
        sha = 'b' * 40
        self.bundle(sha, corrupt=True)
        with self.assertRaisesRegex(RuntimeError, 'checksum'):
            self.deploy(sha)
        self.assertFalse(self.target.is_symlink())
        self.assertEqual((self.target / 'index.html').read_text(), 'previous frontend')

    def test_missing_mini_entry_leaves_existing_frontend_untouched(self):
        sha = 'f' * 40
        self.bundle(sha, missing_mini=True)
        with self.assertRaisesRegex(RuntimeError, 'Missing mini-program'):
            self.deploy(sha)
        self.assertFalse(self.target.is_symlink())
        self.assertEqual((self.target / 'index.html').read_text(), 'previous frontend')

    def test_mini_spa_fallback_rolls_back_release(self):
        sha = '1' * 40
        self.bundle(sha)
        with self.assertRaisesRegex(RuntimeError, 'HTTP'):
            self.deploy(sha, mini_fallback=True)
        self.assertEqual((self.target / 'index.html').read_text(), 'previous frontend')

    def test_failed_first_release_restores_original_directory(self):
        sha = 'c' * 40
        self.bundle(sha)
        with self.assertRaisesRegex(RuntimeError, 'HTTP'):
            self.deploy(sha, fail_http=True)
        self.assertFalse(self.target.is_symlink())
        self.assertEqual((self.target / 'index.html').read_text(), 'previous frontend')

    def test_failed_followup_release_restores_previous_link(self):
        first, second = 'd' * 40, 'e' * 40
        self.bundle(first)
        self.deploy(first)
        old = self.target.resolve()
        self.bundle(second)
        with self.assertRaisesRegex(RuntimeError, 'HTTP'):
            self.deploy(second, fail_http=True)
        self.assertEqual(self.target.resolve(), old)
        self.assertEqual((self.target / 'SOURCE_COMMIT').read_text().strip(), first)

    def test_verified_release_can_be_redeployed_after_another_release(self):
        first, second = '1' * 40, '2' * 40
        for sha in (first, second):
            self.bundle(sha)
            self.deploy(sha)
        self.deploy(first)
        self.assertEqual((self.target / 'SOURCE_COMMIT').read_text().strip(), first)
        self.deploy(first)
        self.assertEqual((self.target / 'SOURCE_COMMIT').read_text().strip(), first)

    def test_reused_release_is_verified_before_switch(self):
        first, second = '3' * 40, '4' * 40
        for sha in (first, second):
            self.bundle(sha)
            self.deploy(sha)
        (self.root / 'frontend-releases' / first / 'site' / 'index.html').write_text('corrupt')
        with self.assertRaisesRegex(RuntimeError, 'checksum'):
            self.deploy(first)
        self.assertEqual((self.target / 'SOURCE_COMMIT').read_text().strip(), second)

    def test_incomplete_release_requires_inspection(self):
        sha = '5' * 40
        self.bundle(sha, corrupt=True)
        with self.assertRaisesRegex(RuntimeError, 'checksum'):
            self.deploy(sha)
        with self.assertRaisesRegex(SystemExit, 'Incomplete'):
            self.deploy(sha)


if __name__ == '__main__':
    unittest.main()
