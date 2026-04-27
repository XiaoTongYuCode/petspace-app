from pathlib import Path


def test_package_json_exists() -> None:
    assert Path('package.json').exists()
