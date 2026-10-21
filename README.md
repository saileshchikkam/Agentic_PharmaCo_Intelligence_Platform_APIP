<<<<<<< HEAD
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
=======
# APIP — Agentic Pharma Co-intelligence Platform

APIP aims to make suspected adverse drug reaction (ADR) reporting simple for patients and useful for the professionals who review it. It connects medical assistance, guided reporting, and evidence-based professional review in one platform.

**Current status:** the running app offers welcome, patient-home, sign-in, fictional ADR drafts, and a guided MedAssist symptom conversation. MedAssist includes optional local AI quote selection and a location-only Google Maps search handoff; clinical urgency assessment and tailored precautions remain disabled. Fictional ADR drafts now save to each local account with revision checks; local email/password signup, cookie sessions and durable SQLite health profiles are connected for development. Google/cloud connection and clinical case workflows remain pending. The developer component library is preserved behind an explicit unrestricted preview route. This is a design/engineering starting point, not a clinically validated or production-ready application. Product implementation is tracked in [the milestone roadmap](docs/roadmap.md).

## The product

- **MedAssist AI:** conversational assistance and care navigation, with a proposed custom-ML research component. Approximately 20–30% of intended scope.
- **ADR reporting and professional intelligence:** guided intake, user-confirmed reports, PDF export, follow-up, professional review, evidence retrieval, and descriptive analytics. Approximately 70–80% of intended scope.
- **Four coordinated agents:** Reporting, Validation, Knowledge, and Analysis. Their production workflow is planned; experimental endpoints do not establish validated capability.

ADR reporting must work directly, without requiring MedAssist first. Important decisions remain reviewable by people. Read the [product vision](docs/product.md) for origin, team, journeys, and scope.

**Current direction:** English only, no required paid services, and all-age scope with caregiver-managed child profiles. Clinical model coverage is not established.

## Start here

- [MedAssist Symptom Assessment v2](models/medassist_v2/README.md): Task 4B official training/validation completed with a verified pre-test seal. All 132,448 synthetic validation interviews were evaluated; selected ranker recall@20 is 77.1866%. This is evidence collection, not clinical accuracy. Locked testing and clinical integration remain unexecuted; five questions remain quarantined and fresh-checkout checksum portability remains unresolved.

- [MedAssist Phase 4A error audit and validation plan](models/medassist/reports/2026-10-19-phase4a/README.md): preserved benchmark, cached error patterns, dataset feasibility and independent-study gates. Offline research only.

- [MedAssist Phase 3 actual ML results](models/medassist/reports/2026-10-19-phase3/README.md): completed offline training, locked evaluation, error findings and model cards. Clinical inference remains disabled.

- [MedAssist Phase 2 baseline protocol](models/medassist/baseline-protocol.md): frozen offline binary/secondary tasks and split reuse. Its freeze-time readiness evidence precedes the completed Phase 3 training.

- [MedAssist ML Phase 1](models/medassist/reports/2026-10-19-phase1/README.md): acquired/profiled NHAMCS offline, reproducible Python pipeline and actual quality/split blockers. No model training or clinical integration.

- [Documentation guide](docs/README.md): where to find information and how to maintain it.
- [Account and shared-profile setup](database/README.md): working local signup/storage, optional Google/cloud setup, ownership rules and limitations.
- [Development setup](docs/development.md): commands, configuration, and verification limits.
- [Architecture](docs/architecture.md): actual code and proposed application design.
- [Layer guides](docs/layers/README.md): responsibilities, boundaries, and acceptance criteria.
- [Roadmap](docs/roadmap.md): sequenced milestones, blockers, and future ideas.
- [AI implementation guide](docs/ai-implementation.md): custom ML, local/API models, evidence-backed RAG, agents, and budget-aware evaluation.
- [Model catalogue and local checks](models/README.md): installed Ollama inventory, hosted-provider candidates, and reproducible fictional diagnostics.
- [Decisions](docs/decisions.md): confirmed direction versus engineering proposals.
- [Research and validation](docs/research-and-validation.md): evidence, datasets, experiments, and release gates.
- [Development history](docs/history/README.md): dated records of actual work and checks.
- [Changelog](CHANGELOG.md): concise notable changes.
- [Contributor and agent instructions](AGENTS.md): mandatory working and documentation rules.

## Existing demonstration

The declared stack includes React, TypeScript, Vite, Tailwind CSS, Material Web, Node.js/Express, and Google GenAI. The repository includes a Bun lockfile.

With Bun available, the intended local workflow is:

```sh
bun install --frozen-lockfile
bun run dev
```

Development uses loopback port `3000`; legacy APIs default off and cannot run in production. `dev` and `start` explicitly select runtime modes. See [runtime configuration](docs/development.md#legacy-api-security-boundary). In the current checkout, the frozen Bun install, frontend lint, and production build passed on 2026-10-17; a clean-clone setup and deployment remain unverified. See [development setup](docs/development.md). The optional AI key is server-side, and the current startup script does not automatically load `.env`.

Open the main page and choose **Sign in**. The Patient, Specialist, and Developer views share a consistent layout. Use only fictional credentials; the preview shows local field feedback and does not sign in or send credentials. See the [welcome/sign-in guide](src/features/access/README.md).

The Developer view includes an explicit **Open developer reference preview** link to the preserved Domain Components, Core Components, and Design Tokens. Appearance settings remain available throughout. The ADR intake can be previewed from the patient sign-in route after selecting ADR reporting; it is fictional-only and supports local account storage or an explicitly separate browser demo. Earlier patient/report/records experiments remain separate. See the [design-system guide](src/design-system/README.md).

## Design direction

All future interfaces must follow [Material Design 3](https://m3.material.io/components) and use [Material Web](https://github.com/material-components/material-web) where available. Preserve the current showcase as reference. Verify responsive behavior, accessibility, interaction states, typography, color roles, and motion rather than assuming the demo already meets every requirement.

## How progress is recorded

Every meaningful change includes relevant documentation and verification results in the same commit. Codex has standing authorization to commit and sync completed APIP work automatically; the repository's post-commit hook performs GitHub sync. See [automatic workflow setup and recovery](scripts/README.md). We use milestones and dated history rather than a fixed-duration project label. Completed work, plans, experiments, and unverified claims remain distinct.

Use fictional cases during development. No official reporting integration, public clinical deployment, or permission to publish patient records is established.

## Team and licence

The team is Sailesh, Jayanth, Mitravind, and Mahesh P; see the [product overview](docs/product.md).

See [LICENSE](LICENSE) for the repository licence. Third-party components, datasets, templates, and terminology retain their own terms.
>>>>>>> 7618d4e63df4ef12615f264cddcf8320237cb2cd
