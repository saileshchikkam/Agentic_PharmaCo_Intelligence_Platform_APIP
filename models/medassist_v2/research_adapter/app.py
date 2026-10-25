"""Separate loopback-only application factory. No production router registration."""
import hmac
import ipaddress
import json
import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.datastructures import Headers

from .schemas import NextRequest, NextResponse
from .service import ArtifactUnavailable, LIMITATIONS, load_preserved
from .demo import DemoResult, FixtureList, demo_fixtures, interview
from .conversation import ConversationVocabulary, conversation_vocabulary
from . import natural

MAX_BODY = 65536


class LocalResearchGuard:
    def __init__(self, app, *, enabled, token):
        self.app, self.enabled, self.token = app, enabled, token

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        headers = Headers(scope=scope)
        try:
            local = ipaddress.ip_address(scope['client'][0]).is_loopback
        except (ValueError, TypeError, KeyError):
            local = False
        host = headers.get('host', '').split(':')[0]
        if not local or host not in ('127.0.0.1', 'localhost') or 'origin' in headers:
            return await JSONResponse({'detail': 'local_research_only'}, status_code=403)(scope, receive, send)
        if not self.enabled:
            return await JSONResponse({'detail': 'research_service_disabled'}, status_code=503)(scope, receive, send)
        supplied = headers.get('authorization', '')
        if not hmac.compare_digest(supplied.encode('utf-8'), ('Bearer '+self.token).encode('utf-8')):
            return await JSONResponse({'detail': 'research_token_required'}, status_code=401)(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            body.extend(message.get('body', b''))
            if len(body) > MAX_BODY:
                return await JSONResponse({'detail': 'request_too_large'}, status_code=413)(scope, receive, send)
            if not message.get('more_body', False):
                break
        if body:
            def unique(items):
                out = {}
                for key, value in items:
                    if key in out:
                        raise ValueError('duplicate_key')
                    out[key] = value
                return out
            try:
                json.loads(body, object_pairs_hook=unique,
                           parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite')))
            except (ValueError, UnicodeError, RecursionError):
                return await JSONResponse({'detail': 'invalid_json'}, status_code=422)(scope, receive, send)
        async def bounded_receive():
            return {'type': 'http.request', 'body': bytes(body), 'more_body': False}
        await self.app(scope, bounded_receive, send)


def create_app(*, service=None, enabled=False, token=None, modular_enabled=False):
    enabled = enabled and isinstance(token, str) and 32 <= len(token) <= 256
    app = FastAPI(title='Model A fictional research adapter', docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(LocalResearchGuard, enabled=enabled, token=token if enabled else '')
    orchestrator = None
    if modular_enabled:
        from models.medassist_ai.core.orchestrator import MedAssistOrchestrator
        from models.medassist_ai.model_a.adapter import ModelAAdapter
        orchestrator = MedAssistOrchestrator(ModelAAdapter(service))

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_request, _exc):
        # FastAPI's default includes the submitted input; never echo it.
        return JSONResponse({'detail': 'invalid_request_schema'}, status_code=422)

    @app.get('/research/model-a/v1/health')
    def health():
        return JSONResponse({'research_only': True, 'available': service is not None},
                            status_code=200 if service is not None else 503)

    @app.post('/research/model-a/v1/next', response_model=NextResponse)
    def next_question(request: NextRequest):
        if service is None:
            return JSONResponse({'detail': 'artifact_unavailable_or_integrity_failed',
                                 'research_only': True, 'limitations': LIMITATIONS}, status_code=503)
        return service.next(request)

    @app.get('/research/model-a/v1/demo/fixtures', response_model=FixtureList)
    def fixtures():
        if service is None:
            return JSONResponse({'detail':'artifact_unavailable_or_integrity_failed'},status_code=503)
        return demo_fixtures(service)

    @app.get('/research/model-a/v1/demo/vocabulary', response_model=ConversationVocabulary)
    def vocabulary():
        if service is None:
            return JSONResponse({'detail':'artifact_unavailable_or_integrity_failed'}, status_code=503)
        try:
            return conversation_vocabulary(service)
        except ValueError:
            return JSONResponse({'detail':'entry_vocabulary_unavailable'}, status_code=503)

    @app.post('/research/model-a/v1/demo/interview', response_model=DemoResult)
    def fictional_interview(request: NextRequest):
        if service is None:
            return JSONResponse({'detail':'artifact_unavailable_or_integrity_failed'},status_code=503)
        if orchestrator is None:
            return interview(service,request)
        try:
            return orchestrator.interview(request)
        except Exception:
            return JSONResponse({'detail':'modular_interview_unavailable'},status_code=503)

    @app.get('/research/model-a/v1/demo/natural/vocabulary')
    def natural_vocabulary():
        if service is None:
            return JSONResponse({'detail':'artifact_unavailable_or_integrity_failed'},status_code=503)
        return natural.vocabulary(service)

    @app.post('/research/model-a/v1/demo/natural/interview')
    def natural_interview(request: natural.NaturalRequest):
        if service is None:
            return JSONResponse({'detail':'artifact_unavailable_or_integrity_failed'},status_code=503)
        try:
            return natural.interview(service, request)
        except natural.NaturalInferenceUnavailable:
            return JSONResponse({'detail':'natural_inference_unavailable'},status_code=503)
        except Exception:
            return JSONResponse({'detail':'invalid_natural_transcript'},status_code=422)

    return app


def from_environment():
    enabled = os.environ.get('MEDASSIST_A_ENABLE_RESEARCH') == '1'
    token = os.environ.get('MEDASSIST_A_TOKEN')
    service = None
    if enabled and token and 32 <= len(token) <= 256:
        try:
            service = load_preserved(os.environ.get('MEDASSIST_A_RUN_ROOT', ''),
                                     os.environ.get('MEDASSIST_A_METADATA_ROOT', ''))
        except ArtifactUnavailable:
            pass  # Unavailable endpoints fail closed; no raw exception/path logs.
    return create_app(service=service, enabled=enabled, token=token,
                      modular_enabled=os.environ.get('APIP_ENABLE_MODULAR_MEDASSIST') == '1')
