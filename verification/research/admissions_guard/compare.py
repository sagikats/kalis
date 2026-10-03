"""Exact decimal differential comparison; reference evidence is mandatory."""
import datetime as dt
import hashlib
import json
import re
import subprocess
import os
from collections import Counter
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from .years import valid_year
from .binding import reference_values, verified_year
from .json_values import same_json_value, strict_json_loads, valid_json_value


def read_path(value, path):
    for part in path.split('.'):
        if not isinstance(value, dict) or part not in value:
            raise KeyError(path)
        value = value[part]
    return value


def equal(actual, expected, places=None):
    if places is not None and (type(places) is not int or not 0 <= places <= 12):
        return False
    # Output values share the strict JSON domain used for canonical inputs.
    # Validate before alternatives: Python equality collapses bools/numbers and
    # can accept non-JSON tuples, sets, subclasses, or shared NaN objects.
    if not valid_json_value(actual) or not valid_json_value(expected):
        return False
    if type(expected) in (bool, dict, list) or expected is None:
        return same_json_value(actual, expected)
    if type(actual) in (bool, dict, list) or actual is None:
        return False
    try:
        a, e = Decimal(str(actual)), Decimal(str(expected))
        if not a.is_finite() or not e.is_finite():
            return False
        if places is not None:
            quantum = Decimal(1).scaleb(-int(places))
            a = a.quantize(quantum, rounding=ROUND_HALF_UP)
            e = e.quantize(quantum, rounding=ROUND_HALF_UP)
        return a == e
    except (InvalidOperation, ValueError):
        return type(actual) is type(expected) and actual == expected


def evidence_errors(fixture, root, now, max_age_days=7):
    errors = []
    proof = fixture.get('provenance', {})
    if proof.get('kind') not in ('official_calculator_response', 'official_worked_example'):
        errors.append('not_official_reference')
    for key in ('source_url', 'sha256', 'artifact', 'captured_at'):
        if not proof.get(key):
            errors.append('missing_' + key)
    if proof.get('artifact'):
        path = (Path(root) / proof['artifact']).resolve()
        try:
            path.relative_to(Path(root).resolve())
            if hashlib.sha256(path.read_bytes()).hexdigest() != proof.get('sha256'):
                errors.append('reference_hash_mismatch')
        except (OSError, ValueError):
            errors.append('reference_artifact_unavailable')
    try:
        captured = dt.datetime.fromisoformat(proof.get('captured_at', '').replace('Z', '+00:00')).timestamp()
        if captured > now + 60 or now - captured > max_age_days * 86400:
            errors.append('reference_stale_or_future')
    except (ValueError, TypeError):
        errors.append('invalid_capture_time')
    if not valid_year(fixture.get('academic_year')):
        errors.append('academic_year_unverified')
    else:
        try:
            if not verified_year(fixture, root, now, max_age_days):
                errors.append('source_year_differs')
        except (ValueError, KeyError, OSError, TypeError, AttributeError):
            errors.append('source_year_proof_missing_or_invalid')
    try:
        parsed = reference_values(fixture, root, now, max_age_days)
        for field, expected in fixture.get('expected', {}).items():
            value = expected['value'] if isinstance(expected, dict) and 'value' in expected else expected
            if field not in parsed or not equal(parsed[field], value):
                errors.append('reference_output_not_bound:' + field)
            if isinstance(expected, dict) and expected.get('decimal_places') is not None:
                places = expected['decimal_places']
                displayed = parsed.get(field)
                match = re.fullmatch(r'-?\d+(?:\.(\d+))?', displayed) if isinstance(displayed, str) else None
                official_places = len(match[1] or '') if match else None
                if type(places) is not int or not 0 <= places <= 12 or places != official_places:
                    errors.append('reference_precision_not_bound:' + field)
    except (ValueError, KeyError, OSError, TypeError, AttributeError, ImportError, SyntaxError):
        errors.append('reference_semantic_binding_missing_or_invalid')
    if not fixture.get('expected'):
        errors.append('no_expected_fields')
    return errors


def candidate_errors(root, candidate_binding):
    binding_errors = []
    if not candidate_binding:
        binding_errors.append('candidate_binding_missing')
    else:
        try:
            for artifact in candidate_binding['artifacts']:
                path = (Path(root) / artifact['path']).resolve()
                path.relative_to(Path(root).resolve())
                if hashlib.sha256(path.read_bytes()).hexdigest() != artifact['sha256']:
                    binding_errors.append('candidate_artifact_hash_mismatch:' + artifact['path'])
            if not candidate_binding['artifacts'] or not candidate_binding.get('source_sha256'):
                binding_errors.append('candidate_binding_incomplete')
            designated = [a for a in candidate_binding['artifacts'] if a['path'] == candidate_binding.get('source_artifact')]
            if len(designated) != 1 or designated[0]['sha256'] != candidate_binding.get('source_sha256'):
                binding_errors.append('candidate_source_artifact_binding_missing_or_invalid')
        except (KeyError, OSError, ValueError, TypeError):
            binding_errors.append('candidate_artifact_unavailable')
    return binding_errors


def compare_rows(fixtures, rows, root, now, max_age_days=7, candidate_binding=None):
    if not isinstance(fixtures, list) or not isinstance(rows, list):
        raise ValueError('fixtures and candidate output must be arrays')
    if any(not isinstance(x, dict) or not isinstance(x.get('input'), dict) or not isinstance(x.get('expected'), dict) for x in fixtures):
        raise ValueError('invalid fixture row shape')
    if any(not isinstance(x, dict) or not isinstance(x.get('input'), dict) or not isinstance(x.get('result'), dict) for x in rows):
        raise ValueError('invalid candidate row shape')
    if any(not isinstance(x.get(key), str) or not x[key].strip()
           for x in fixtures + rows for key in ('institutionId', 'caseId')):
        raise ValueError('case and institution identities must be nonempty strings')
    if any(not valid_json_value(x['input']) for x in fixtures + rows):
        raise ValueError('Canonical inputs must contain only finite JSON values')
    binding_errors = candidate_errors(root, candidate_binding)
    reference_keys = [(x['institutionId'], x['caseId']) for x in fixtures]
    reference_pairs = set(reference_keys)
    duplicate_references = sorted(key for key, count in Counter(reference_keys).items() if count > 1)
    by_key = {}
    duplicates = set()
    for row in rows:
        key = (row.get('institutionId'), row.get('caseId'))
        if key in by_key:
            duplicates.add(key)
        by_key[key] = row
    unexpected_pairs = sorted(set(by_key) - reference_pairs)
    contract_errors = []
    if duplicate_references:
        contract_errors.append('duplicate_reference_case')
    if unexpected_pairs:
        contract_errors.append('unexpected_candidate_output')
    results = []
    for fixture in fixtures:
        key = (fixture.get('institutionId'), fixture.get('caseId'))
        errors = evidence_errors(fixture, root, now, max_age_days) + binding_errors + contract_errors
        row = by_key.get(key)
        comparisons = []
        if key in duplicates:
            errors.append('duplicate_candidate_output')
        if row is None:
            errors.append('candidate_output_missing')
        else:
            source = row.get('source')
            if not isinstance(source, dict) or not source.get('sha256'):
                errors.append('candidate_source_hash_missing')
            elif candidate_binding and row['source']['sha256'] != candidate_binding.get('source_sha256'):
                errors.append('candidate_source_hash_mismatch')
            if not same_json_value(row.get('input'), fixture.get('input')):
                errors.append('candidate_input_differs')
            for field, reference in fixture.get('expected', {}).items():
                if isinstance(reference, dict) and 'value' in reference:
                    expected, places = reference['value'], reference.get('decimal_places')
                else:
                    expected, places = reference, None
                try:
                    actual = read_path(row['result'], field)
                    match = equal(actual, expected, places)
                except (KeyError, TypeError):
                    actual, match = None, False
                comparisons.append({'field': field, 'expected': expected, 'actual': actual, 'match': match, 'decimal_places': places})
        mismatches = [x for x in comparisons if not x['match']]
        status = 'reference_unverified' if errors else ('mismatch' if mismatches else 'passed')
        results.append({'caseId': key[1], 'institutionId': key[0], 'function_id': fixture.get('function_id'),
                        'academic_year': fixture.get('academic_year'), 'status': status, 'errors': errors,
                        'numeric_parity': bool(comparisons) and not mismatches,
                        'comparisons': comparisons, 'candidate_source': row.get('source') if row else None,
                        'provenance': fixture.get('provenance')})
    return {'schema_version': 1, 'verified_at': now, 'passed': bool(results) and all(x['status'] == 'passed' for x in results),
            'case_count': len(results), 'results': results, 'contract_errors': contract_errors,
            'unexpected_candidate_case_pairs': [list(key) for key in unexpected_pairs],
            'duplicate_reference_case_pairs': [list(key) for key in duplicate_references],
            'boundary': 'Only the listed identical inputs, outputs, code hash and reference evidence; finite cases do not prove all-input equivalence.'}


def run_candidate(argv, fixtures, cwd, timeout=30, candidate_binding=None):
    if (not isinstance(fixtures, list) or any(not isinstance(x, dict)
            or not isinstance(x.get('input'), dict) or not valid_json_value(x['input'])
            or any(not isinstance(x.get(key), str) or not x[key].strip()
                   for key in ('institutionId', 'caseId')) for x in fixtures)):
        raise ValueError('Invalid canonical candidate cases before execution')
    cases = [{'caseId': x['caseId'], 'institutionId': x['institutionId'], 'profile': x['input']} for x in fixtures]
    if not argv or not isinstance(argv, list) or not all(isinstance(x, str) for x in argv):
        raise ValueError('candidate command must be an explicit argument array')
    errors = candidate_errors(cwd, candidate_binding)
    if errors:
        raise ValueError('Candidate approval pins failed before execution: ' + ','.join(errors))
    if candidate_binding.get('command') != argv:
        raise ValueError('Candidate command differs from the reviewed argument array')
    environment=dict(os.environ)
    for key in ('NODE_OPTIONS','NODE_PATH'):environment.pop(key,None)
    process = subprocess.run(argv, input=json.dumps(cases, ensure_ascii=False, allow_nan=False), text=True, capture_output=True, cwd=cwd, timeout=timeout, check=True,env=environment)
    if len(process.stdout) > 10 * 1024 * 1024:
        raise ValueError('candidate output too large')
    rows = strict_json_loads(process.stdout)
    if not isinstance(rows, list):
        raise ValueError('candidate adapter must return an array')
    return rows
