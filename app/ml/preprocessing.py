import pandas as pd
import joblib
from pathlib import Path


class DiseasePreprocessor:
    def __init__(self, dataset_path):
        self.dataset_path = Path(dataset_path)
        self.df = None
        self.symptom_columns = None

    def load_dataset(self):
        """Load the disease dataset."""
        self.df = pd.read_csv(self.dataset_path)
        print(f"Dataset Loaded Successfully")
        print(f"Shape : {self.df.shape}")

    def clean_data(self):
        """Clean symptom values."""
        symptom_cols = [col for col in self.df.columns if col.startswith("Symptom")]

        for col in symptom_cols:
            self.df[col] = (
                self.df[col]
                .fillna("")
                .astype(str)
                .str.strip()
                .str.lower()
            )

    def build_feature_matrix(self):
        """
        Convert symptom columns into binary encoded columns.
        """

        symptom_cols = [col for col in self.df.columns if col.startswith("Symptom")]

        unique_symptoms = set()

        for col in symptom_cols:
            unique_symptoms.update(
                self.df[col].unique()
            )

        unique_symptoms.discard("")
        unique_symptoms.discard("nan")

        unique_symptoms = sorted(list(unique_symptoms))

        encoded_df = pd.DataFrame(0, index=self.df.index, columns=unique_symptoms)

        for _, row in self.df.iterrows():

            row_index = row.name

            for col in symptom_cols:

                symptom = row[col]

                if symptom != "" and symptom != "nan":

                    encoded_df.at[row_index, symptom] = 1

        encoded_df["Disease"] = self.df["Disease"]

        self.df = encoded_df
        self.symptom_columns = unique_symptoms

        print(f"\nTotal Diseases : {self.df['Disease'].nunique()}")
        print(f"Total Symptoms : {len(unique_symptoms)}")

    def save_processed_dataset(self):

        output_folder = Path("data/processed")
        output_folder.mkdir(parents=True, exist_ok=True)

        processed_dataset = output_folder / "processed_dataset.csv"

        self.df.to_csv(processed_dataset, index=False)

        joblib.dump(
            self.symptom_columns,
            "app/ml/symptom_columns.joblib"
        )

        print("\nProcessed Dataset Saved")
        print(processed_dataset)

    def process(self):

        self.load_dataset()

        self.clean_data()

        self.build_feature_matrix()

        self.save_processed_dataset()


if __name__ == "__main__":

    preprocessor = DiseasePreprocessor(
        "data/dataset.csv"
    )

    preprocessor.process()