"""Backend-only Groq metadata access. Never logs a key, headers, or response bodies."""
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request

BASE = 'https://api.groq.com/openai/v1/'


def backend_key():
    key = os.environ.get('GROQ_API_KEY', '').strip()
    if key:
        return key
    # Only this explicitly opened/authorized ignored backend file is supported.
    path = Path('.env.server')
    if path.is_file() and subprocess.run(['git', 'check-ignore', '--quiet', '.env.server'],
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            match = re.match(r'^\s*GROQ_API_KEY\s*=\s*(.*?)\s*$', line)
            if match:
                value = match.group(1).strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                    value = value[1:-1]
                if value and not value.startswith('<'):
                    return value
    raise ValueError('BACKEND_KEY_NOT_CONFIGURED')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request_json(key, endpoint, payload=None):
    if endpoint not in ('models', 'chat/completions'):
        raise ValueError('GROQ_ENDPOINT_NOT_ALLOWED')
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(BASE + endpoint, data=data,
        headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json',
                 'User-Agent': 'APIP-fictional-extraction-evaluation/1.0'})
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=15) as response:
            raw = response.read(65537)
            if len(raw) > 65536:
                raise ValueError('GROQ_RESPONSE_TOO_LARGE')
            result = json.loads(raw)
            headers = {k.lower(): v for k, v in response.headers.items() if k.lower().startswith('x-ratelimit-')}
            return result, headers
    except urllib.error.HTTPError as error:
        # Never include provider bodies, request headers, credentials or account IDs.
        raise ValueError('GROQ_HTTP_' + str(error.code)) from None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        raise ValueError('GROQ_REQUEST_FAILED') from None


def accessible_models(key):
    result, _ = request_json(key, 'models')
    return sorted(m['id'] for m in result.get('data', []) if isinstance(m, dict)
                  and isinstance(m.get('id'), str) and re.fullmatch(r'[\w./:-]{1,128}', m['id'])
                  and m.get('active', True))
