import pandas as pd

from app.ml.model_loader import loader


class DiseasePredictor:

    def __init__(self):
        self.model = loader.model
        self.label_encoder = loader.label_encoder
        self.symptom_columns = loader.symptom_columns

    def predict(self, symptoms: list[str]):

        input_data = {symptom: 0 for symptom in self.symptom_columns}

        for symptom in symptoms:

            symptom = symptom.strip().lower()

            if symptom in input_data:
                input_data[symptom] = 1

        X = pd.DataFrame([input_data])

        prediction = self.model.predict(X)[0]

        probabilities = self.model.predict_proba(X)[0]

        confidence = round(float(max(probabilities) * 100), 2)

        disease = self.label_encoder.inverse_transform([prediction])[0]

        return {
            "predicted_disease": disease,
            "confidence": confidence
       }


predictor = DiseasePredictor()