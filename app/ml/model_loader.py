from pathlib import Path
import joblib


BASE_DIR = Path(__file__).parent

MODEL_PATH = BASE_DIR / "model.joblib"
LABEL_ENCODER_PATH = BASE_DIR / "label_encoder.joblib"
SYMPTOM_COLUMNS_PATH = BASE_DIR / "symptom_columns.joblib"


class ModelLoader:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.symptom_columns = None

    def load(self):
        self.model = joblib.load(MODEL_PATH)
        self.label_encoder = joblib.load(LABEL_ENCODER_PATH)
        self.symptom_columns = joblib.load(SYMPTOM_COLUMNS_PATH)

        print("✅ AI Model Loaded Successfully")


loader = ModelLoader()
loader.load()