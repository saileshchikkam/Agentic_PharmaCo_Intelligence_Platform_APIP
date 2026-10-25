# Jayanth MedAssist backend — preserved contributor documentation

Historical contributor description preserved from the first section of root README at commit `6965b204bbc70eac91fccad5669a8a1c384c6844`, originating in `357906c45945e9e42fcd0dabe234f9c178ad2ec3`. Only the broken outer merge markers were removed from that section.

**Not an approved deployment or clinical run guide.** The original standalone `app/` backend is separate from the APIP Express/React application and modular research adapter. Its disease predictions, probability scores, precautions and hospital claims below are historical contributor descriptions, not verified capabilities of the current APIP product. Do not start `app.main`, import its prediction smoke script or deserialize its Joblib files as part of APIP setup: import-time model loading and database writes require separate trust/configuration review. Dataset/precaution rights, provenance and clinical suitability are unresolved. Use fictional data only.

See the [current APIP overview](../../README.md), [technical validation](../../models/medassist_ai/docs/jayanth-technical-validation.md) and [reconciliation record](../reconciliation-2026-10-26.md).

---

# 🏥 MedAssist AI

An AI-powered healthcare web application that predicts the most probable disease based on user-selected symptoms using Machine Learning. The application provides disease predictions, confidence scores, precautionary measures, nearby hospital information, and maintains a history of previous predictions. It is designed as a production-style Machine Learning application using FastAPI, PostgreSQL, and Scikit-learn.

---

# 📌 Project Overview

MedAssist AI aims to assist users by providing an initial assessment of possible diseases based on symptoms entered by the user. Instead of replacing medical professionals, the system serves as an intelligent decision-support tool that helps users understand potential health conditions and encourages timely medical consultation.

The project demonstrates the integration of Machine Learning, Backend API development, Database Management, Authentication, and Deployment into a single real-world application.

---

# 🎯 Objectives

* Predict diseases using Machine Learning models.
* Provide confidence scores for each prediction.
* Display recommended precautions based on the predicted disease.
* Maintain prediction history for every user.
* Authenticate users securely using JWT Authentication.
* Store user and prediction data in PostgreSQL.
* Demonstrate an industry-standard ML deployment workflow using FastAPI.

---

# 🚀 Key Features

## User Authentication

* User Registration
* Secure Login
* JWT Authentication
* Password Hashing
* User Profile Management

---

## Disease Prediction

* Select symptoms from predefined options.
* Predict the most probable disease.
* Display confidence score.
* Display disease description.
* Display precautionary measures.

---

## Prediction History

* Store previous predictions.
* View prediction history.
* Track previous diagnoses.

---

## Hospital Locator

* Find nearby hospitals.
* Display hospital information.
* Google Maps Integration (Future Enhancement).

---

## Admin Module

* Manage diseases.
* Manage symptoms.
* Manage users.
* View application statistics.

---

# 👥 User Roles

## User

Users can:

* Register
* Login
* Predict diseases
* View prediction history
* Update profile
* View nearby hospitals

---

## Admin

Administrators can:

* Manage users
* Manage diseases
* Manage symptom data
* Monitor application usage

---

# 🛠 Technology Stack

| Category             | Technology       |
| -------------------- | ---------------- |
| Programming Language | Python           |
| Backend Framework    | FastAPI          |
| Machine Learning     | Scikit-learn     |
| Data Processing      | Pandas, NumPy    |
| Database             | PostgreSQL       |
| ORM                  | SQLAlchemy       |
| Authentication       | JWT              |
| Password Security    | Passlib (bcrypt) |
| API Testing          | Postman          |
| Version Control      | Git & GitHub     |
| Deployment           | Docker           |
| Cloud                | AWS              |
| IDE                  | VS Code          |
| ML Development       | Jupyter Notebook |

---

# 🏗 Project Architecture

```text
Frontend (HTML, CSS, Bootstrap, JavaScript)
                    │
                    ▼
             FastAPI Backend
                    │
     ┌──────────────┴──────────────┐
     │                             │
     ▼                             ▼
Machine Learning Model      PostgreSQL Database
     │
     ▼
Prediction Results
```

---

# 📂 Planned Project Structure

```text
MedAssist-AI/
│
├── app/
│   ├── api/
│   ├── database/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── ml/
│   ├── utils/
│   ├── static/
│   ├── templates/
│   └── main.py
│
├── datasets/
├── notebooks/
├── trained_models/
├── tests/
├── requirements.txt
├── README.md
├── .env
└── Dockerfile
```

---

# 🔄 Application Workflow

```text
User
 │
 ▼
Register / Login
 │
 ▼
Dashboard
 │
 ▼
Select Symptoms
 │
 ▼
Submit Prediction Request
 │
 ▼
FastAPI Backend
 │
 ▼
Machine Learning Model
 │
 ▼
Disease Prediction
 │
 ▼
Confidence Score
 │
 ▼
Precautions
 │
 ▼
Save Prediction
 │
 ▼
Display Results
```

---

# 🧠 Machine Learning Workflow

1. Collect Disease Dataset
2. Data Cleaning
3. Data Preprocessing
4. Feature Engineering
5. Model Training
6. Model Evaluation
7. Model Serialization using Joblib
8. Integrate Model with FastAPI
9. Deploy Application

---

# 📊 Planned Machine Learning Models

* Logistic Regression
* Decision Tree
* Random Forest
* XGBoost (Future Comparison)

The model with the best evaluation metrics will be selected for deployment.

---

# 🔐 Security Features

* JWT Authentication
* Password Hashing using bcrypt
* Input Validation
* Secure API Endpoints
* Environment Variables for Sensitive Credentials

---

# 🌍 Future Enhancements

* Doctor Recommendations
* Live Hospital Availability
* Medicine Recommendation
* Email Reports
* PDF Medical Reports
* Appointment Booking
* AI Chatbot for Health Queries
* Multi-language Support

---

# ⚠️ Disclaimer

This application is intended for educational and research purposes only. The disease predictions generated by the system should not be considered a substitute for professional medical diagnosis or treatment. Users are strongly advised to consult qualified healthcare professionals for medical advice.

---

# 👨‍💻 Author

**Jayanth K**

B.Tech – Computer Science and Engineering (Artificial Intelligence & Machine Learning)

Takshashila University

---

# ⭐ Project Status

🚧 Currently Under Development
