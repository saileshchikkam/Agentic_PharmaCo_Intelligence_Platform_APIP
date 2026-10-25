from typing import Protocol


class SafetyProvider(Protocol):
    def check(self, evidence) -> dict: ...


class UnavailableSafety:
    def check(self, evidence):
        return {'status': 'unavailable', 'reason': 'independent_clinician_review_required'}
