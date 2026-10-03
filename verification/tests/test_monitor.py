"""Failure-path checks against actual product modules and immutable raw captures."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import sys
import types

REPO = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('monitor', REPO / 'verification/monitor.py')
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)


class MonitorTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        config = monitor.load(REPO / 'verification/binding.json')
        evidence = monitor.load(REPO / 'verification/research/manifest.json')
        paths = {p['path'] for p in config['reviewed_artifacts'] + config['candidate_binding']['artifacts']}
        paths |= {'verification/binding.json', 'verification/research/manifest.json'}
        paths |= {'verification/research/' + p['path'] for p in evidence['files']}
        paths |= {p['path'] for p in monitor.load(REPO / 'verification/coverage.json')['pinned_source_artifacts']}
        for name in paths:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(REPO / name, target)

    def tearDown(self):
        self.temporary.cleanup()

    def test_actual_replay_retains_known_numeric_and_year_gaps(self):
        r = monitor.execute(self.root)
        self.assertEqual((r['numeric_matches'], r['case_count']), (25, 29))
        self.assertTrue(r['regression_passed'])
        self.assertEqual(r['status'], 'review_required')
        self.assertEqual(r['current_official_verified_cases'], 0)
        self.assertFalse(r['publication_allowed'])
        self.assertEqual(r['http_attempt_count'], 0)
        self.assertEqual(sum(x['institutionId'] == 'technion' and x['numeric_parity'] for x in r['comparison']['results']), 20)
        tau = [x for x in r['comparison']['results'] if x['caseId'] == 'tau-A-scores'][0]
        self.assertFalse(tau['numeric_parity'])
        self.assertTrue(any(x['actual'] is None and x['field'] == 'medicinePreliminary' for x in tau['comparisons']))

    def test_changed_calculator_stops_before_execution(self):
        path = self.root / 'src/modules/calculators/technion.ts'
        path.write_text(path.read_text() + '\nthrow new Error("must not execute drift");\n')
        r = monitor.execute(self.root)
        self.assertEqual(r['status'], 'source_drift')
        self.assertNotIn('comparison', r)
        self.assertFalse(r['regression_passed'])

    def test_raw_reference_or_expected_edit_is_never_silently_accepted(self):
        path = self.root / 'verification/research/coverage/official-fixtures.json'
        rows = monitor.load(path)
        rows[0]['expected']['bagrutAverage'] = 0
        path.write_text(json.dumps(rows))
        self.assertEqual(monitor.execute(self.root)['status'], 'source_drift')

    def test_changed_guard_is_rejected_before_import(self):
        path = self.root / 'verification/research/admissions_guard/compare.py'
        path.write_text('raise RuntimeError("must not import drift")\n')
        self.assertEqual(monitor.execute(self.root)['status'], 'source_drift')

    def test_catalog_drift_is_explicit(self):
        path = self.root / 'src/data/academicData.json'
        path.write_text(path.read_text() + '\n')
        self.assertEqual(monitor.execute(self.root)['status'], 'coverage_drift')

    def test_old_success_is_replaced_by_execution_failure(self):
        output = self.root / 'report.json'
        output.write_text('{"status":"passed","publication_allowed":true}')
        (self.root / 'verification/binding.json').write_text('{broken')
        p = subprocess.run(['python3', 'verification/monitor.py', '--output', str(output), '--regression-only'], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(p.returncode, 2)
        r = monitor.load(output)
        self.assertEqual(r['status'], 'execution_failed')
        self.assertFalse(r['publication_allowed'])

    def test_strict_json_and_cardinality(self):
        bad = self.root / 'bad.json'
        for raw in ('{"x":1,"x":2}', '{"x":NaN}', '{"x":1e999}'):
            bad.write_text(raw)
            with self.assertRaises(ValueError): monitor.load(bad)
        p = subprocess.run(['node', 'verification/candidate.cjs'], cwd=self.root, input='[]', capture_output=True, text=True)
        self.assertNotEqual(p.returncode, 0)

    def test_explicit_null_scope_and_duplicate_cases_are_rejected(self):
        fixture = monitor.load(self.root / 'verification/research/coverage/official-fixtures.json')[0]
        case = {'caseId': fixture['caseId'], 'institutionId': fixture['institutionId'], 'profile': fixture['input']}
        for key in ('certificateType', 'schoolSector'):
            bad = dict(case, profile=dict(case['profile'], **{key: None}))
            p = subprocess.run(['node', 'verification/candidate.cjs'], cwd=self.root, input=json.dumps([bad]), capture_output=True, text=True)
            self.assertNotEqual(p.returncode, 0, key)
        p = subprocess.run(['node', 'verification/candidate.cjs'], cwd=self.root, input=json.dumps([case, case]), capture_output=True, text=True)
        self.assertNotEqual(p.returncode, 0)

    def test_guard_swap_after_hash_does_not_execute_unchecked_bytes(self):
        original = monitor.check_pins
        marker = self.root / 'unchecked-guard-executed'
        changed = False
        def swap(root, pins, captured=None):
            nonlocal changed
            errors = original(root, pins, captured)
            name = 'verification/research/admissions_guard/compare.py'
            if not changed and any(p['path'] == name for p in pins):
                changed = True
                path = root / name
                path.write_text(path.read_text() + '\nfrom pathlib import Path\nPath(' + repr(str(marker)) + ').write_text("unreviewed")\n')
            return errors
        with patch.object(monitor, 'check_pins', side_effect=swap):
            report = monitor.execute(self.root)
        self.assertTrue(report['regression_passed'])
        self.assertFalse(marker.exists())
        self.assertEqual(report['execution_mode'], 'checked_bytes_snapshot')

    def test_checked_data_and_candidate_ignore_post_hash_checkout_swaps(self):
        original = monitor.check_pins
        marker = self.root / 'unchecked-candidate-executed'
        def swap(root, pins, captured=None):
            errors = original(root, pins, captured)
            if any(p['path'] == 'src/data/academicData.json' for p in pins):
                (root / 'verification/numeric-baseline.json').write_text('{"cases":[]}')
                (root / 'verification/research/coverage/official-fixtures.json').write_text('[]')
                (root / 'verification/coverage.json').write_text('{}')
                (root / 'verification/candidate.cjs').write_text('require("node:fs").writeFileSync(' + json.dumps(str(marker)) + ',"unreviewed");throw Error("must not execute");')
            return errors
        with patch.object(monitor, 'check_pins', side_effect=swap):
            report = monitor.execute(self.root)
        self.assertEqual((report['numeric_matches'], report['case_count']), (25, 29))
        self.assertTrue(report['regression_passed'])
        self.assertFalse(marker.exists())

    def test_ambient_guard_module_cannot_override_reviewed_code(self):
        fake = types.ModuleType('admissions_guard.compare')
        fake.run_candidate = lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError('ambient module executed'))
        with patch.dict(sys.modules, {'admissions_guard.compare': fake}):
            self.assertTrue(monitor.execute(self.root)['regression_passed'])
        self.assertFalse(any(name.startswith('_kalis_reviewed_guard_') for name in sys.modules))

    def test_snapshot_paths_cannot_escape_root(self):
        for name in ('../escape', '/absolute/file'):
            self.assertTrue(monitor.check_pins(self.root, [{'path': name, 'sha256': '0' * 64}], {}))


if __name__ == '__main__':
    unittest.main()
