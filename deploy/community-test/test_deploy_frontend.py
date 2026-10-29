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

    def bundle(self, sha, corrupt=False):
        files = {'index.html': b'new frontend', 'SOURCE_COMMIT': (sha + '\n').encode()}
        manifest = {'commit': sha, 'sha256': {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}}
        if corrupt:
            manifest['sha256']['index.html'] = '0' * 64
        files['manifest.json'] = json.dumps(manifest).encode()
        with tarfile.open(str(self.incoming / ('frontend-' + sha + '.tar.gz')), 'w:gz') as archive:
            for name, data in files.items():
                info = tarfile.TarInfo(name)
                info.size = len(data)
                archive.addfile(info, io.BytesIO(data))

    def deploy(self, sha, fail_http=False):
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
            filename = request.full_url.rsplit('/', 1)[-1]
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


if __name__ == '__main__':
    unittest.main()
