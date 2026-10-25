from .interface import ModelBResult


class DisabledModelB:
    def assess(self, evidence):
        return ModelBResult()
