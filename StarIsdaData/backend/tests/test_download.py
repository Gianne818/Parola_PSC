import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from download import _download


def test_download_returns_none_when_subset_fails(tmp_path):
    with patch("download.subprocess.run", side_effect=subprocess.CalledProcessError(1, ["copernicusmarine"])):
        with patch("download.OUTPUT_DIR", str(tmp_path)):
            assert _download("fake-dataset", ["fake-variable"]) is None
