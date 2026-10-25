"""Explicit metadata-only check, no completion endpoint or inference side effects."""
import json
from models.medassist_intelligence.groq_access import accessible_models, backend_key

try:
    key = backend_key()
    print(json.dumps({'key_configured': True, 'available_model_ids': accessible_models(key),
                      'inference_requests': 0, 'account_free_plan_verified_by_api': False}))
except ValueError as error:
    print(json.dumps({'status': 'blocked', 'reason': str(error), 'inference_requests': 0}))
