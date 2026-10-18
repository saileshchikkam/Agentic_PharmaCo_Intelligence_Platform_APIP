# Model comparison — actual fit-only CV

2026-10-19. Frozen [protocol v1](../../baseline-protocol.md), unchanged. Scores are mean three-fold fit-only validation results, not accuracy percentages or clinical validation. Primary selection uses average precision; secondary selection uses macro F1. All family-best configurations and overall winners were fixed before either test was scored.

All **60 configurations / 180 fold fits / 12 final fits / six primary sigmoid calibrations** completed. No recorded candidate/final-fit warnings, failures or timeouts. Exact fold scores, durations and every configuration are in [training-results.json](training-results.json). Fixed estimator parameters remain in the protocol; values below are selected grid parameters.

## Primary age/sex reference

CV endpoint: average precision. Predeclared overall CV winner: **LR**.

- **LR:** CV 0.225800; selected `{"C": 10.0}`. Fold scores 0.288098, 0.190976, 0.198326. Final fitting/calibration/serialization stage 0.17 seconds.

- **RF:** CV 0.223419; selected `{"max_depth": null, "min_samples_leaf": 20}`. Fold scores 0.272979, 0.194814, 0.202463. Final fitting/calibration/serialization stage 1.63 seconds.

- **HGB:** CV 0.221643; selected `{"learning_rate": 0.05, "max_leaf_nodes": 15, "l2_regularization": 1.0}`. Fold scores 0.270741, 0.191554, 0.202632. Final fitting/calibration/serialization stage 1.20 seconds.

## Primary age/sex plus initial vitals

CV endpoint: average precision. Predeclared overall CV winner: **RF**.

- **LR:** CV 0.309044; selected `{"C": 10.0}`. Fold scores 0.392159, 0.257744, 0.277230. Final fitting/calibration/serialization stage 0.31 seconds.

- **RF:** CV 0.358169; selected `{"max_depth": 12, "min_samples_leaf": 5}`. Fold scores 0.416703, 0.318889, 0.338915. Final fitting/calibration/serialization stage 2.86 seconds.

- **HGB:** CV 0.347344; selected `{"learning_rate": 0.05, "max_leaf_nodes": 15, "l2_regularization": 1.0}`. Fold scores 0.412748, 0.307329, 0.321954. Final fitting/calibration/serialization stage 0.69 seconds.

## Secondary symptom features

CV endpoint: macro F1. Predeclared overall CV winner: **HGB**.

- **LR:** CV 0.297458; selected `{"C": 10.0}`. Fold scores 0.301167, 0.304903, 0.286304. Final fitting/calibration/serialization stage 1.38 seconds.

- **RF:** CV 0.245200; selected `{"max_depth": null, "min_samples_leaf": 5}`. Fold scores 0.253222, 0.224754, 0.257624. Final fitting/calibration/serialization stage 4.79 seconds.

- **HGB:** CV 0.306698; selected `{"learning_rate": 0.05, "max_leaf_nodes": 15, "l2_regularization": 1.0}`. Fold scores 0.307814, 0.292582, 0.319697. Final fitting/calibration/serialization stage 3.04 seconds.

## Secondary symptom features plus initial vitals

CV endpoint: macro F1. Predeclared overall CV winner: **HGB**.

- **LR:** CV 0.309837; selected `{"C": 10.0}`. Fold scores 0.309684, 0.321482, 0.298344. Final fitting/calibration/serialization stage 0.83 seconds.

- **RF:** CV 0.199304; selected `{"max_depth": null, "min_samples_leaf": 5}`. Fold scores 0.230373, 0.170142, 0.197396. Final fitting/calibration/serialization stage 2.23 seconds.

- **HGB:** CV 0.322904; selected `{"learning_rate": 0.05, "max_leaf_nodes": 15, "l2_regularization": 1.0}`. Fold scores 0.310261, 0.318088, 0.340363. Final fitting/calibration/serialization stage 3.82 seconds.

## Interpretation

Vitals raised primary CV average precision for all three families. Secondary RF macro F1 decreased with vitals; do not claim every variant improves. The secondary vitals LR has a slightly higher observed test macro F1 than the predeclared HGB winner; HGB remains the declared winner because test scores are not a selection set. These are descriptive comparisons, with no valid cluster intervals or significance claim for this test design. The fit-prevalence reference is reported separately in test-results.json, never as a fourth competing family.
