"""Strict JSON decoding and semantic equality for complete canonical inputs."""
import json
import math

def valid_json_value(value):
    def valid(current, active):
        kind = type(current)
        if current is None or kind in (bool, int, str):
            return True
        if kind is float:
            return math.isfinite(current)
        if kind not in (list, dict) or id(current) in active:
            return False
        if kind is dict and any(type(key) is not str for key in current):
            return False
        active.add(id(current))
        try:
            return all(valid(child, active) for child in
                       (current.values() if kind is dict else current))
        finally:
            active.discard(id(current))
    try:
        return valid(value, set())
    except RecursionError:
        return False

def same_json_value(left, right):
    if not valid_json_value(left) or not valid_json_value(right):
        return False
    def same(a, b):
        if type(a) in (int, float) and type(b) in (int, float):
            return a == b
        if type(a) is not type(b):
            return False
        if type(a) is dict:
            return a.keys() == b.keys() and all(same(a[key], b[key]) for key in a)
        if type(a) is list:
            return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
        return a == b
    try:
        return same(left, right)
    except RecursionError:
        return False

def strict_json_loads(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('Duplicate JSON key')
            result[key] = value
        return result
    def invalid_constant(value):
        raise ValueError('Nonstandard JSON constant')
    value = json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid_constant)
    if not valid_json_value(value):
        raise ValueError('Invalid or nonfinite JSON value')
    return value
