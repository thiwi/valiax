import os, sys, importlib.util
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
spec = importlib.util.spec_from_file_location("run_rules", os.path.join(ROOT, "runner", "run-rules.py"))
run_rules = importlib.util.module_from_spec(spec)
spec.loader.exec_module(run_rules)

def test_exec_rule_sandbox_restricts_imports():
    code_ok = "import math\nresult = math.sqrt(4)"
    res = run_rules.exec_rule_sandbox(code_ok, None, allowed_imports=['math'])
    assert res == 2.0

    code_bad = "import os\nresult = 'bad'"
    res2 = run_rules.exec_rule_sandbox(code_bad, None, allowed_imports=['math'])
    assert "not allowed" in str(res2)
