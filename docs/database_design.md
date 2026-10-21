Users
-------
id
full_name
email
password_hash
age
gender
created_at


Diseases
---------
id
disease_name
description
specialist


Symptoms
---------
id
symptom_name


DiseaseSymptoms
----------------
disease_id
symptom_id


Precautions
------------
id
disease_id
precaution


Predictions
------------
id
user_id
disease_id
confidence
prediction_time


Hospitals
----------
id
hospital_name
address
city
latitude
longitude
phone