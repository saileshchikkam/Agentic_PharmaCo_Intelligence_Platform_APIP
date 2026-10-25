"""Opt-in local launcher; no bind-host, production, training or evaluation switches."""
import os


def main():
    if os.environ.get('MEDASSIST_A_ENABLE_RESEARCH') != '1':
        raise SystemExit('Set the explicit fictional research opt-in before starting.')
    token = os.environ.get('MEDASSIST_A_TOKEN', '')
    if not 32 <= len(token) <= 256:
        raise SystemExit('Configure a private research token of 32 to 256 characters.')
    import uvicorn
    from .app import from_environment
    uvicorn.run(from_environment(), host='127.0.0.1', port=8766, workers=1,
                access_log=False, log_level='critical', proxy_headers=False)


if __name__ == '__main__':
    main()
