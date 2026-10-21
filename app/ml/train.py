from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


class DiseaseTrainer:

    def __init__(self):

        self.dataset = None
        self.model = None
        self.label_encoder = LabelEncoder()

    def load_dataset(self):

        dataset_path = Path("data/processed/processed_dataset.csv")

        self.dataset = pd.read_csv(dataset_path)

        print("Processed Dataset Loaded")
        print(self.dataset.shape)

    def prepare_data(self):

        X = self.dataset.drop(columns=["Disease"])

        y = self.dataset["Disease"]

        y = self.label_encoder.fit_transform(y)

        return train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y
        )

    def train(self):

        X_train, X_test, y_train, y_test = self.prepare_data()

        self.model = RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X_train, y_train)

        predictions = self.model.predict(X_test)

        accuracy = accuracy_score(y_test, predictions)

        print("\n==============================")
        print(f"Accuracy : {accuracy * 100:.2f}%")
        print("==============================\n")

        print(classification_report(
            y_test,
            predictions,
            target_names=self.label_encoder.classes_
        ))

    def save_model(self):

        model_folder = Path("app/ml")

        joblib.dump(
            self.model,
            model_folder / "model.joblib"
        )

        joblib.dump(
            self.label_encoder,
            model_folder / "label_encoder.joblib"
        )

        print("\nModel Saved Successfully")

    def run(self):

        self.load_dataset()

        self.train()

        self.save_model()


if __name__ == "__main__":

    trainer = DiseaseTrainer()

    trainer.run()