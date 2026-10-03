"""Reparse immutable reference artifacts; labels alone cannot attest outputs."""
import hashlib
import datetime as dt
import json
import re
import types
import urllib.parse
import time
from decimal import Decimal
from pathlib import Path
from .json_values import same_json_value, strict_json_loads


def checked_bytes(root, proof):
    path = (Path(root) / proof['artifact']).resolve()
    path.relative_to(Path(root).resolve())
    body = path.read_bytes()
    if hashlib.sha256(body).hexdigest() != proof['sha256']:
        raise ValueError('artifact hash differs')
    return body


def path_value(value, path):
    for part in path.split('.'):
        value = value[part]
    return value


def checked_module(root, path, sha256):
    code = checked_bytes(root, {'artifact': path, 'sha256': sha256})
    name = 'reviewed_parser_' + hashlib.sha256(code).hexdigest()[:12]
    parser = types.ModuleType(name)
    parser.__file__ = str((Path(root) / path).resolve())
    # Execute exactly the checked bytes, rather than reopening a mutable path.
    exec(compile(code, parser.__file__, 'exec'), parser.__dict__)
    return parser


def reference_values(fixture, root, now=None, max_age_days=7):
    binding = fixture['reference_binding']
    body = checked_bytes(root, fixture['provenance'])
    input_proof = fixture['provenance']['input_record']
    inputs = strict_json_loads(checked_bytes(root, input_proof))
    if not same_json_value(path_value(inputs, input_proof['input_path']), fixture['input']):
        raise ValueError('reference input record differs')
    if binding['kind'] == 'json':
        data = strict_json_loads(body)
        return {field: path_value(data, path) for field, path in binding['paths'].items()}
    parser = checked_module(root, binding['parser_file'], binding['parser_sha256'])
    kind = binding['kind']
    if kind == 'technion':
        parsed = parser.parse_technion(body, fixture['input'])
        return {k: v for k, v in parsed.items() if k != 'intermediates'}
    if kind == 'tau_bagrut':
        return parser.parse_tau_bagrut(body, fixture['input'])
    if kind == 'tau_scores':
        average = binding['bagrut_reference']
        if (average['institutionId'] != 'tau' or not same_json_value(average['input'], fixture['input'])
            or average['reference_binding']['kind'] != 'tau_bagrut'
            or average['provenance']['kind'] != 'official_calculator_response'
            or average['provenance']['source_url'] != parser.TAU_BAGRUT_URL):
            raise ValueError('TAU average must be an official same-profile bagrut reference')
        captured = dt.datetime.fromisoformat(average['provenance']['captured_at'].replace('Z', '+00:00')).timestamp()
        current = time.time() if now is None else now
        if captured > current + 60 or current - captured > max_age_days * 86400:
            raise ValueError('TAU average reference stale or future')
        parsed_average = reference_values(average, root, current, max_age_days)['bagrutAverage']
        if Decimal(str(parsed_average)) != Decimal(str(binding['official_bagrut_average'])):
            raise ValueError('TAU supplied average differs from official same-profile response')
        return parser.parse_tau_scores(body, fixture['input'], binding['official_bagrut_average'])
    if kind == 'reichman':
        context = binding['request_context']
        parsed = parser.parse_response(body.decode('utf-8'), fixture['input'], academic_year='תשפ"ז', calculator_year_status='undated_current_capture', request_context=context)
        return {'bagrutAverage': parsed['bagrut_average_shown'], 'officialScore': parsed['score_shown']}
    raise ValueError('unsupported reference parser')


def verified_year(fixture, root, now, max_age_days=7):
    proof = fixture['year_provenance']
    if proof['kind'] != 'official_year_statement':
        raise ValueError('not an official year statement')
    scope = proof['scope']
    if (scope['institutionId'] != fixture['institutionId'] or scope['function_id'] != fixture['function_id']
        or scope['calculator_url'] != fixture['provenance']['source_url']):
        raise ValueError('year statement belongs to a different calculator scope')
    published_url = urllib.parse.urlparse(proof['source_url'])
    calculator_url = urllib.parse.urlparse(scope['calculator_url'])
    if (published_url.scheme != 'https' or published_url.username or published_url.password
        or published_url.hostname != calculator_url.hostname
        or (published_url.port or 443) != (calculator_url.port or 443)):
        raise ValueError('year statement official origin not bound')
    captured = dt.datetime.fromisoformat(proof['captured_at'].replace('Z', '+00:00')).timestamp()
    if captured > now + 60 or now - captured > max_age_days * 86400:
        raise ValueError('year statement stale or future')
    body = checked_bytes(root, proof)
    if proof.get('selector_kind') == 'json':
        published = path_value(strict_json_loads(body), proof['path'])
    elif proof.get('selector_kind') == 'regex':
        matches = re.findall(proof['pattern'], body.decode('utf-8'))
        if len(matches) != 1 or not isinstance(matches[0], str):
            raise ValueError('ambiguous source year')
        published = matches[0]
    else:
        raise ValueError('unsupported year selector')
    label = str(published).replace('״', '').replace('"', '').replace("'", '').replace('׳', '')
    mapping = {'תשפד': '2023/24', 'תשפה': '2024/25', 'תשפו': '2025/26', 'תשפז': '2026/27', 'תשפח': '2027/28', 'תשפט': '2028/29', 'תשצ': '2029/30'}
    canonical = mapping.get(label, label)
    return canonical == fixture['academic_year']
