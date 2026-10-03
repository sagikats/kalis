#!/usr/bin/env python3
"""Offline source-bound replay of product calculators. No AI or HTTP."""
import argparse
from contextlib import contextmanager
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path
import sys
import tempfile
import time
import types
import uuid

ROOT = Path(__file__).resolve().parents[1]
def decode(body):
    # Bootstrap only with standard-library code; checked guard bytes are imported
    # after their pins pass. Reject duplicate keys and non-finite JSON as well.
    def pairs(items):
        result = {}
        for k, v in items:
            if k in result: raise ValueError('Duplicate JSON key')
            result[k] = v
        return result
    def number(value):
        result = float(value)
        if not math.isfinite(result): raise ValueError('Non-finite JSON')
        return result
    def invalid(value):
        raise ValueError('Invalid JSON constant')
    return json.loads(body.decode('utf-8'), object_pairs_hook=pairs, parse_float=number, parse_constant=invalid)


def load(path):
    return decode(path.read_bytes())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(dir=path.parent, prefix='.' + path.name)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def check_pins(root, pins, captured=None):
    errors = []
    for pin in pins:
        try:
            if not isinstance(pin['path'], str) or Path(pin['path']).is_absolute() or '..' in Path(pin['path']).parts:
                raise ValueError('Pins must be confined relative paths')
            path = (root / pin['path']).resolve()
            path.relative_to(root.resolve())
            body = path.read_bytes()
            if hashlib.sha256(body).hexdigest() != pin['sha256']:
                errors.append('artifact_hash_mismatch:' + pin['path'])
            elif captured is not None:
                captured[pin['path']] = body
        except (OSError, ValueError, KeyError, TypeError):
            errors.append('artifact_unavailable:' + str(pin.get('path')))
    return errors


@contextmanager
def checked_guard(captured):
    """Compile the checked bytes; never import guard code from disk or cache."""
    namespace = '_kalis_reviewed_guard_' + uuid.uuid4().hex
    modules = {}
    try:
        package = types.ModuleType(namespace)
        package.__package__ = namespace
        package.__path__ = []  # No filesystem fallback for relative imports.
        sys.modules[namespace] = package
        modules[namespace] = package
        for name in ('__init__', 'years', 'json_values', 'binding', 'compare'):
            key = 'verification/research/admissions_guard/' + name + '.py'
            qualified = namespace if name == '__init__' else namespace + '.' + name
            module = package if name == '__init__' else types.ModuleType(qualified)
            module.__package__ = namespace
            module.__file__ = '<checked:' + key + '>'
            sys.modules[qualified] = module
            modules[qualified] = module
            exec(compile(captured[key], module.__file__, 'exec'), module.__dict__)
        yield modules[namespace + '.compare'], modules[namespace + '.json_values']
    finally:
        for qualified, module in modules.items():
            if sys.modules.get(qualified) is module:
                del sys.modules[qualified]


def numeric_snapshot(comparison):
    return [{'caseId': r['caseId'], 'institutionId': r['institutionId'],
             'numeric_parity': r['numeric_parity'], 'comparisons': r['comparisons']}
            for r in comparison['results']]


def execute(root, now=None):
    now = time.time() if now is None else now
    config = load(root / 'verification/binding.json')
    captured = {}
    # Verify the manifest itself before trusting its artifact inventory.
    errors = check_pins(root, config['reviewed_artifacts'], captured)
    if errors:
        return {'status': 'source_drift', 'errors': errors, 'regression_passed': False,
                'publication_allowed': False, 'http_attempt_count': 0}
    evidence = decode(captured['verification/research/manifest.json'])
    pins = [dict(p, path='verification/research/' + p['path']) for p in evidence['files']]
    errors = check_pins(root, pins + config['candidate_binding']['artifacts'], captured)
    if errors:
        return {'status': 'source_drift', 'errors': errors, 'regression_passed': False,
                'publication_allowed': False, 'http_attempt_count': 0}
    coverage = decode(captured['verification/coverage.json'])
    errors = check_pins(root, coverage['pinned_source_artifacts'], captured)
    if errors:
        return {'status': 'coverage_drift', 'errors': errors, 'regression_passed': False,
                'publication_allowed': False, 'http_attempt_count': 0}
    fixtures = decode(captured['verification/research/coverage/official-fixtures.json'])
    baseline = decode(captured['verification/numeric-baseline.json'])
    # Preserve immutable fixture bytes. Project their original capture-relative
    # evidence paths into this repository without weakening path confinement.
    def relocate(value):
        if isinstance(value, list): return [relocate(v) for v in value]
        if not isinstance(value, dict): return value
        result = {k: relocate(v) for k, v in value.items()}
        for key in ('artifact', 'parser_file'):
            if key in result: result[key] = 'verification/research/' + result[key]
        return result
    # Execute the actual checked TS/jiti closure and parse captured references in
    # a disposable snapshot. Changes to the checkout during a run cannot mix
    # reviewed and newly loaded code or change expected values behind the check.
    with tempfile.TemporaryDirectory(prefix='kalis-admission-checked-') as directory:
        snapshot = Path(directory).resolve()
        for name, body in captured.items():
            target = (snapshot / name).resolve()
            target.relative_to(snapshot)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
        with checked_guard(captured) as (guard, values):
            rows = guard.run_candidate(config['candidate_binding']['command'], fixtures, snapshot,
                                       candidate_binding=config['candidate_binding'])
            comparison = guard.compare_rows(relocate(fixtures), rows, snapshot, now,
                                            config['reference_max_age_days'], config['candidate_binding'])
            unchanged = values.same_json_value(numeric_snapshot(comparison), baseline['cases'])
    errors = sorted({e for r in comparison['results'] for e in r['errors']})
    # Year/age gaps affect current official verification; corrupted binding,
    # candidate identity or re-parsing also invalidates historical regression.
    integrity_errors = [e for e in errors if e not in ('academic_year_unverified', 'reference_stale_or_future')]
    regression_passed = unchanged and not integrity_errors and not comparison['contract_errors']
    return {'status': 'review_required' if regression_passed else 'regression_failed',
            'regression_passed': regression_passed, 'baseline_unchanged': unchanged,
            'numeric_matches': sum(r['numeric_parity'] for r in comparison['results']),
            'case_count': len(fixtures), 'current_official_verified_cases': sum(r['status'] == 'passed' for r in comparison['results']),
            'comparison': comparison, 'coverage': coverage,
            'execution_mode': 'checked_bytes_snapshot',
            'source_freshness': 'not_observed_offline', 'http_attempt_count': 0,
            'publication_allowed': False,
            'boundary': 'Historical numeric regression only. Live university changes and all-input/current-year equivalence are not established.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cadence', choices=('daily', 'weekly'), default='daily')
    parser.add_argument('--output', type=Path, default=ROOT / '.admission-validation/latest.json')
    parser.add_argument('--regression-only', action='store_true', help='Exit 0 only for unchanged historical regression, never current official approval')
    args = parser.parse_args()
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    save(args.output, {'status': 'running', 'started_at': started, 'regression_passed': False, 'publication_allowed': False})
    try:
        report = execute(ROOT)
    except Exception as error:
        report = {'status': 'execution_failed', 'error': type(error).__name__, 'regression_passed': False,
                  'publication_allowed': False, 'http_attempt_count': 0}
    report.update(schema_version=1, started_at=started, finished_at=dt.datetime.now(dt.timezone.utc).isoformat(), cadence=args.cadence)
    save(args.output, report)
    print(json.dumps({k: report.get(k) for k in ('status', 'regression_passed', 'numeric_matches', 'case_count', 'current_official_verified_cases', 'http_attempt_count')}, ensure_ascii=False))
    return 0 if args.regression_only and report['regression_passed'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
