import copy
import hashlib
import importlib.util
import json
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('compose', ROOT / 'deploy/community-test/compose_control_plane.py')
compose = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compose)


class PatchesTest(unittest.TestCase):
    def setUp(self):
        self.spec = json.loads((ROOT / 'deploy/community-test/device-ui-patches.json').read_text(encoding='utf-8'))
        self.files = {entry['path']: subprocess.check_output(['git', 'show', compose.BASELINE + ':' + entry['path']], cwd=str(ROOT)) for entry in self.spec['files']}

    def test_exact_seven_files_and_result_hash(self):
        original = dict(self.files)
        result = compose.apply_device_patches(self.files, self.spec)
        self.assertEqual(len(result), 7)
        for item in result:
            self.assertNotEqual(original[item['path']], self.files[item['path']])
            self.assertEqual(hashlib.sha256(self.files[item['path']]).hexdigest(), item['patched_sha256'])

    def test_source_change_refused(self):
        key = next(iter(self.files)); self.files[key] += b'\n'
        with self.assertRaisesRegex(ValueError, 'source hash'): compose.apply_device_patches(self.files, self.spec)

    def test_ambiguous_context_refused(self):
        self.spec['files'][0]['changes'][0]['before'] = ' '
        with self.assertRaisesRegex(ValueError, 'not unique'): compose.apply_device_patches(self.files, self.spec)

    def test_result_tampering_refused(self):
        self.spec['files'][0]['changes'][0]['after'] += '// altered'
        with self.assertRaisesRegex(ValueError, 'result hash'): compose.apply_device_patches(self.files, self.spec)

    def test_unapproved_or_duplicate_path_refused(self):
        self.spec['files'].append(copy.deepcopy(self.spec['files'][0]))
        with self.assertRaisesRegex(ValueError, 'unique overlay'): compose.apply_device_patches(self.files, self.spec)


if __name__ == '__main__': unittest.main()
