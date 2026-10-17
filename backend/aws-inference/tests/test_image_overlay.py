import gzip
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import unittest

SPEC = importlib.util.spec_from_file_location('overlay', Path(__file__).resolve().parents[1]/'image_overlay.py')
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class ImageOverlayChecks(unittest.TestCase):
    def setUp(self):
        self.manifest = {'schemaVersion': 2, 'mediaType': 'application/vnd.docker.distribution.manifest.v2+json',
                         'config': {'mediaType': 'application/vnd.docker.container.image.v1+json', 'digest': 'old', 'size': 1},
                         'layers': [{'mediaType': 'application/vnd.docker.image.rootfs.diff.tar.gzip', 'digest': 'existing', 'size': 12}]}
        self.config = {'architecture': 'arm64', 'os': 'linux', 'rootfs': {'type': 'layers', 'diff_ids': ['original']},
                       'config': {'Cmd': ['lambda_function.handler'], 'Entrypoint': ['/lambda-entrypoint.sh'], 'Env': ['LANG=en_US.UTF-8']},
                       'history': [{'created_by': 'original base'}]}
        self.files = {'lambda_function.py': b'def handler(event, context):\n    return 1\n',
                      'validated_csv_handler.py': b'FEATURES = []\n'}

    def test_only_application_files_change_and_runtime_is_retained(self):
        result = module.make_overlay(self.manifest, self.config, self.files, '2026-10-17T00:00:00Z')
        new_manifest, new_config = json.loads(result['manifest']), json.loads(result['config'])
        self.assertEqual(new_manifest['layers'][:-1], self.manifest['layers'])
        self.assertEqual(new_config['config'], self.config['config'])
        self.assertEqual(new_config['architecture'], 'arm64')
        self.assertEqual(self.config['rootfs']['diff_ids'], ['original'])
        self.assertEqual(len(self.manifest['layers']), 1)
        raw = gzip.decompress(result['layer'])
        self.assertEqual(new_config['rootfs']['diff_ids'][-1], module.digest(raw))
        with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
            self.assertEqual(sorted(archive.getnames()), ['var/task/lambda_function.py', 'var/task/validated_csv_handler.py'])
            for name, content in self.files.items():
                self.assertEqual(archive.extractfile('var/task/'+name).read(), content)
        self.assertEqual(new_manifest['config']['digest'], module.digest(result['config']))
        self.assertEqual(new_manifest['layers'][-1]['digest'], module.digest(result['layer']))

    def test_architecture_mismatch_and_unreviewed_files_are_rejected(self):
        self.config['architecture'] = 'amd64'
        with self.assertRaisesRegex(ValueError, 'ARM64'):
            module.make_overlay(self.manifest, self.config, self.files)
        self.config['architecture'] = 'arm64'
        self.files['.env.local'] = b'fixture'
        with self.assertRaisesRegex(ValueError, 'reviewed application'):
            module.make_overlay(self.manifest, self.config, self.files)

    def test_oci_base_keeps_oci_descriptor_types(self):
        self.manifest['mediaType'] = 'application/vnd.oci.image.manifest.v1+json'
        self.manifest['config']['mediaType'] = 'application/vnd.oci.image.config.v1+json'
        result = module.make_overlay(self.manifest, self.config, self.files)
        manifest = json.loads(result['manifest'])
        self.assertEqual(manifest['config']['mediaType'], 'application/vnd.oci.image.config.v1+json')
        self.assertEqual(manifest['layers'][-1]['mediaType'], 'application/vnd.oci.image.layer.v1.tar+gzip')


if __name__ == '__main__':
    unittest.main()
