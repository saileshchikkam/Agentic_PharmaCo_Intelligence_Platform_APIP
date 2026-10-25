class ComponentUnavailable(RuntimeError):
    """Public error codes only; never include provider bodies, evidence or paths."""


class EvidenceRejected(ValueError):
    pass
