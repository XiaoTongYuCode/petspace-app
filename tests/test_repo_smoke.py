from pathlib import Path
import json


def test_package_json_exists() -> None:
    assert Path('package.json').exists()


def test_required_scripts_exist() -> None:
    package = json.loads(Path("package.json").read_text(encoding="utf-8"))
    scripts = package.get("scripts", {})
    assert "inline" in scripts
    assert "node_lint" in scripts
