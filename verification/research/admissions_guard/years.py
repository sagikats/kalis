"""Canonical academic year contract. Unknown labels cannot count as years."""
import re


def valid_year(value):
    if not isinstance(value, str):
        return False
    match = re.fullmatch(r'(20\d{2})/(\d{2}|20\d{2})', value)
    if not match:
        return False
    start, end = int(match[1]), int(match[2])
    return end == (start + 1 if len(match[2]) == 4 else (start + 1) % 100)
