"""Append application source to the pinned ARM64 image, retaining its runtime.

No dependency rebuild or architecture emulation is needed for a source-only
layer. This module builds OCI/Docker descriptors; network publication is kept
in the explicitly invoked operator workflow.
"""

import copy
from datetime import datetime, timezone
import gzip
import hashlib
import io
import json
import tarfile


def digest(data):
    return 'sha256:'+hashlib.sha256(data).hexdigest()


def make_overlay(manifest, config, files, created=None):
    if config.get('architecture') != 'arm64' or config.get('os') != 'linux':
        raise ValueError('Expected the verified Linux ARM64 base image')
    if manifest.get('schemaVersion') != 2 or 'layers' not in manifest:
        raise ValueError('A single-platform schema-v2 image is required')
    if len(config.get('rootfs', {}).get('diff_ids', [])) != len(manifest['layers']):
        raise ValueError('Base manifest and root filesystem layers differ')
    if set(files) != {'lambda_function.py', 'validated_csv_handler.py'}:
        raise ValueError('Only the reviewed application source files may be overlaid')
    archive_bytes = io.BytesIO()
    with tarfile.open(fileobj=archive_bytes, mode='w', format=tarfile.PAX_FORMAT) as archive:
        for name, contents in sorted(files.items()):
            compile(contents, name, 'exec')
            member = tarfile.TarInfo('var/task/'+name)
            member.size = len(contents)
            member.mode = 0o644
            member.mtime = 0
            member.uid = member.gid = 0
            archive.addfile(member, io.BytesIO(contents))
    raw_layer = archive_bytes.getvalue()
    layer = gzip.compress(raw_layer, mtime=0)
    result_config, result_manifest = copy.deepcopy(config), copy.deepcopy(manifest)
    created = created or datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    result_config['created'] = created
    result_config['rootfs']['diff_ids'].append(digest(raw_layer))
    result_config.setdefault('history', []).append({'created': created,
                                                   'created_by': 'Parola validated real-input scoring source overlay'})
    config_bytes = json.dumps(result_config, separators=(',', ':'), ensure_ascii=False).encode()
    result_manifest['config'].update(digest=digest(config_bytes), size=len(config_bytes))
    layer_type = ('application/vnd.oci.image.layer.v1.tar+gzip'
                  if manifest.get('mediaType') == 'application/vnd.oci.image.manifest.v1+json'
                  else 'application/vnd.docker.image.rootfs.diff.tar.gzip')
    result_manifest['layers'].append({'mediaType': layer_type, 'digest': digest(layer), 'size': len(layer)})
    manifest_bytes = json.dumps(result_manifest, separators=(',', ':')).encode()
    return {'layer': layer, 'config': config_bytes, 'manifest': manifest_bytes,
            'image_digest': digest(manifest_bytes)}


def upload_blob(client, registry_id, repository, data):
    upload = client.initiate_layer_upload(registryId=registry_id, repositoryName=repository)
    part_size = upload['partSize']
    for offset in range(0, len(data), part_size):
        part = data[offset:offset+part_size]
        client.upload_layer_part(registryId=registry_id, repositoryName=repository,
                                 uploadId=upload['uploadId'], partFirstByte=offset,
                                 partLastByte=offset+len(part)-1, layerPartBlob=part)
    client.complete_layer_upload(registryId=registry_id, repositoryName=repository,
                                 uploadId=upload['uploadId'], layerDigests=[digest(data)])
