from app.ml.predict import predictor

result = predictor.predict([
    "itching",
    "skin_rash",
    "nodal_skin_eruptions"
])

print(result)