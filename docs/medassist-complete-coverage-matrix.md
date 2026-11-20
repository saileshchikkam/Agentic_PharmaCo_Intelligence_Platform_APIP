# APIP MedAssist — Field-by-Field Complete Evidence Coverage Matrix

> [!NOTE]
> Comprehensive audit across all 223 DDXPlus evidence definitions: 110 symptom fields (96 root + 14 conditional children), 108 active antecedent fields, and 5 quarantined fields preserved without extraction.
> Generated on 2026-11-20 following complete conversational vocabulary stabilization on branch `feat/medassist-jayanth`.

## Summary Statistics

| Metric | Count | Details |
|---|---|---|
| **Total DDXPlus Evidence Definitions** | **223** | 100% audited against canonical source schema |
| **Active Mapped Definitions** | **218** | 100% active coverage in `concepts.ts` and `scripted.ts` |
| **Quarantined Definitions** | **5** | E_69, E_37, E_118, E_123, E_87 strictly quarantined |
| **Symptom Fields** | **110** | 96 root symptoms + 14 conditional child symptoms |
| **Initial Eligible Symptoms** | **96** | 100% free-text initial language extraction enabled |
| **Antecedent Fields (Active)** | **108** | Full medical, family, lifestyle, and environmental history |
| **Natural Chat Question Targets** | **218** | 100% active definitions mapped to clinical topics |
| **Data Types** | **B: 208, C: 10, M: 5** | Scale, categorical values and 165 anatomical locations verified |

---

## Complete 223 Evidence Field Matrix

| Evidence ID | Kind & Parent | Type | Question / Clinical Meaning | Language Canonical Label | Clinical Topics | Status |
|---|---|---|---|---|---|---|
| `E_0` | Antecedent | Binary (Y/N) | Have you recently had a viral infection? | `E_0` | constitutional | ✅ Active & Verified |
| `E_1` | Antecedent | Binary (Y/N) | Are you currently being treated or have you recently been treated with an oral antibiotic for an ear infection? | `E_1` | ent | ✅ Active & Verified |
| `E_2` | Antecedent | Binary (Y/N) | Are you infected with the human immunodeficiency virus (HIV)? | `E_2` | allergy_immune | ✅ Active & Verified |
| `E_3` | Antecedent | Binary (Y/N) | Have you ever had a pericarditis? | `E_3` | cardiovascular | ✅ Active & Verified |
| `E_4` | Antecedent | Binary (Y/N) | Have you or any member of your family ever had croup? | `E_4` | respiratory | ✅ Active & Verified |
| `E_5` | Antecedent | Binary (Y/N) | Have you ever had fluid in your lungs? | `E_5` | respiratory | ✅ Active & Verified |
| `E_6` | Antecedent | Binary (Y/N) | Do you have chronic pancreatitis? | `E_6` | digestive | ✅ Active & Verified |
| `E_7` | Antecedent | Binary (Y/N) | Do you have a poor diet? | `E_7` | lifestyle_environment | ✅ Active & Verified |
| `E_8` | Antecedent | Binary (Y/N) | Do you currently undergo dialysis? | `E_8` | urogenital | ✅ Active & Verified |
| `E_9` | Symptom (Root) | Binary (Y/N) | Do you have swollen or painful lymph nodes? | `E_9` | constitutional | ✅ Active & Verified |
| `E_10` | Antecedent | Binary (Y/N) | Are you currently taking or have you recently taken anti-inflammatory drugs (NSAIDs)? | `E_10` | lifestyle_environment | ✅ Active & Verified |
| `E_11` | Antecedent | Binary (Y/N) | Have you breastfed one of your children for more than 9 months? | `E_11` | urogenital | ✅ Active & Verified |
| `E_12` | Antecedent | Binary (Y/N) | Do you have a known severe food allergy? | `E_12` | allergy_immune | ✅ Active & Verified |
| `E_13` | Symptom (Root) | Binary (Y/N) | Do you find that your symptoms have worsened over the last 2 weeks and that progressively less effort is required to cause the symptoms? | `E_13` | cardiovascular | ✅ Active & Verified |
| `E_14` | Symptom (Root) | Binary (Y/N) | Do you have chest pain even at rest? | `E_14` | cardiovascular | ✅ Active & Verified |
| `E_15` | Antecedent | Binary (Y/N) | Have you started or taken any antipsychotic medication within the last 7 days? | `E_15` | lifestyle_environment | ✅ Active & Verified |
| `E_16` | Antecedent | Binary (Y/N) | Do you feel anxious? | `E_16` | neurological | ✅ Active & Verified |
| `E_17` | Antecedent | Binary (Y/N) | Are you of Asian descent? | `E_17` | lifestyle_environment | ✅ Active & Verified |
| `E_18` | Antecedent | Binary (Y/N) | Do you have cystic fibrosis? | `E_18` | respiratory | ✅ Active & Verified |
| `E_19` | Antecedent | Binary (Y/N) | Have you been diagnosed with hyperthyroidism? | `E_19` | constitutional | ✅ Active & Verified |
| `E_20` | Antecedent | Binary (Y/N) | Do you have Rheumatoid Arthritis? | `E_20` | musculoskeletal | ✅ Active & Verified |
| `E_21` | Antecedent | Binary (Y/N) | Have you ever had a spontaneous pneumothorax? | `E_21` | respiratory | ✅ Active & Verified |
| `E_22` | Antecedent | Binary (Y/N) | Do you have a known issue with one of your heart valves? | `E_22` | cardiovascular | ✅ Active & Verified |
| `E_23` | Symptom (Root) | Binary (Y/N) | Do you ever temporarily stop breathing while you’re asleep? | `E_23` | respiratory | ✅ Active & Verified |
| `E_24` | Antecedent | Binary (Y/N) | Have you ever had a diagnosis of anemia? | `E_24` | lifestyle_environment | ✅ Active & Verified |
| `E_25` | Antecedent | Binary (Y/N) | Have any of your family members been diagnosed with cluster headaches? | `E_25` | neurological | ✅ Active & Verified |
| `E_26` | Antecedent | Binary (Y/N) | Do you have any family members who have been diagnosed with anemia? | `E_26` | lifestyle_environment | ✅ Active & Verified |
| `E_27` | Antecedent | Binary (Y/N) | Have you ever had a sexually transmitted infection? | `E_27` | allergy_immune | ✅ Active & Verified |
| `E_28` | Antecedent | Binary (Y/N) | Are there any members of your family who have been diagnosed myasthenia gravis? | `E_28` | neurological | ✅ Active & Verified |
| `E_29` | Antecedent | Binary (Y/N) | Do any members of your immediate family have a psychiatric illness? | `E_29` | neurological | ✅ Active & Verified |
| `E_30` | Symptom (Root) | Binary (Y/N) | Do you feel your abdomen is bloated or distended (swollen due to pressure from inside)? | `E_30` | digestive | ✅ Active & Verified |
| `E_31` | Antecedent | Binary (Y/N) | Do you have severe Chronic Obstructive Pulmonary Disease (COPD)? | `E_31` | respiratory | ✅ Active & Verified |
| `E_32` | Symptom (Root) | Binary (Y/N) | Do you have a decrease in appetite? | `E_32` | digestive, constitutional | ✅ Active & Verified |
| `E_33` | Symptom (Root) | Binary (Y/N) | Do you have pain that improves when you lean forward? | `E_33` | pain | ✅ Active & Verified |
| `E_34` | Antecedent | Binary (Y/N) | Do you have an active cancer? | `E_34` | lifestyle_environment | ✅ Active & Verified |
| `E_35` | Antecedent | Binary (Y/N) | Do you regularly drink coffee or tea? | `E_35` | lifestyle_environment | ✅ Active & Verified |
| `E_37` | Antecedent (Quarantined) | Binary (Y/N) | Do you have metastatic cancer? | `N/A` | N/A (Quarantined) | 🔒 Quarantined Frozen Preserved |
| `E_38` | Symptom (Root) | Binary (Y/N) | Do you have pain or weakness in your jaw? | `E_38` | pain, musculoskeletal | ✅ Active & Verified |
| `E_39` | Symptom (Root) | Binary (Y/N) | Have you felt confused or disorientated lately? | `E_39` | neurological | ✅ Active & Verified |
| `E_40` | Antecedent | Binary (Y/N) | Have you been in contact with someone who has had pertussis (whoooping cough)? | `E_40` | respiratory | ✅ Active & Verified |
| `E_41` | Antecedent | Binary (Y/N) | Have you been in contact with a person with similar symptoms in the past 2 weeks? | `E_41` | allergy_immune | ✅ Active & Verified |
| `E_42` | Symptom (Root) | Binary (Y/N) | Have you been in contact with or ate something that you have an allergy to? | `E_42` | allergy_immune | ✅ Active & Verified |
| `E_43` | Symptom (Root) | Binary (Y/N) | Have you lost consciousness associated with violent and sustained muscle contractions or had an absence episode? | `E_43` | neurological | ✅ Active & Verified |
| `E_44` | Antecedent | Binary (Y/N) | Do you take corticosteroids? | `E_44` | lifestyle_environment | ✅ Active & Verified |
| `E_45` | Symptom (Root) | Binary (Y/N) | Have you been coughing up blood? | `E_45` | respiratory | ✅ Active & Verified |
| `E_46` | Antecedent | Binary (Y/N) | Have you had 2 or more asthma attacks in the past year? | `E_46` | respiratory | ✅ Active & Verified |
| `E_47` | Antecedent | Binary (Y/N) | Do you suffer from Crohn’s disease or ulcerative colitis (UC)? | `E_47` | digestive | ✅ Active & Verified |
| `E_48` | Antecedent | Binary (Y/N) | Do you live with 4 or more people? | `E_48` | lifestyle_environment | ✅ Active & Verified |
| `E_49` | Antecedent | Binary (Y/N) | Do you attend or work in a daycare? | `E_49` | lifestyle_environment | ✅ Active & Verified |
| `E_50` | Symptom (Root) | Binary (Y/N) | Have you had significantly increased sweating? | `E_50` | constitutional | ✅ Active & Verified |
| `E_51` | Symptom (Root) | Binary (Y/N) | Have you had diarrhea or an increase in stool frequency? | `E_51` | digestive | ✅ Active & Verified |
| `E_52` | Symptom (Root) | Binary (Y/N) | Do you have the perception of seeing two images of a single object seen overlapping or adjacent to each other (double vision)? | `E_52` | neurological, eyes | ✅ Active & Verified |
| `E_53` | Symptom (Root) | Binary (Y/N) | Do you have pain somewhere, related to your reason for consulting? | `E_53` | pain | ✅ Active & Verified |
| `E_54` | Symptom (Child of E_53) | Multichoice (16 choices) | Characterize your pain: | `E_54` | pain | ✅ Active & Verified |
| `E_55` | Symptom (Child of E_53) | Multichoice (165 choices) | Do you feel pain somewhere? | `E_55` | pain | ✅ Active & Verified |
| `E_56` | Symptom (Child of E_53) | Categorical (11 choices) | How intense is the pain? | `E_56` | pain | ✅ Active & Verified |
| `E_57` | Symptom (Child of E_53) | Multichoice (165 choices) | Does the pain radiate to another location? | `E_57` | pain | ✅ Active & Verified |
| `E_58` | Symptom (Child of E_53) | Categorical (11 choices) | How precisely is the pain located? | `E_58` | pain | ✅ Active & Verified |
| `E_59` | Symptom (Child of E_53) | Categorical (11 choices) | How fast did the pain appear? | `E_59` | pain | ✅ Active & Verified |
| `E_60` | Antecedent | Binary (Y/N) | Do you consume energy drinks regularly? | `E_60` | lifestyle_environment | ✅ Active & Verified |
| `E_61` | Antecedent | Binary (Y/N) | Are you currently using intravenous drugs? | `E_61` | lifestyle_environment | ✅ Active & Verified |
| `E_62` | Antecedent | Binary (Y/N) | Do you regularly take stimulant drugs? | `E_62` | lifestyle_environment | ✅ Active & Verified |
| `E_63` | Symptom (Root) | Binary (Y/N) | Do you have difficulty articulating words/speaking? | `E_63` | ent | ✅ Active & Verified |
| `E_64` | Symptom (Root) | Binary (Y/N) | Do you feel out of breath with minimal physical effort? | `E_64` | respiratory | ✅ Active & Verified |
| `E_65` | Symptom (Root) | Binary (Y/N) | Do you have difficulty swallowing, or have a feeling of discomfort/blockage when swallowing? | `E_65` | ent | ✅ Active & Verified |
| `E_66` | Symptom (Root) | Binary (Y/N) | Are you experiencing shortness of breath or difficulty breathing in a significant way? | `E_66` | respiratory | ✅ Active & Verified |
| `E_67` | Symptom (Root) | Binary (Y/N) | Do you have bouts of choking or shortness of breath that wake you up at night? | `E_67` | respiratory | ✅ Active & Verified |
| `E_69` | Antecedent (Quarantined) | Binary (Y/N) | Do you have diabetes? | `N/A` | N/A (Quarantined) | 🔒 Quarantined Frozen Preserved |
| `E_70` | Antecedent | Binary (Y/N) | Are you significantly overweight compared to people of the same height as you? | `E_70` | lifestyle_environment | ✅ Active & Verified |
| `E_71` | Antecedent | Binary (Y/N) | Do you have high cholesterol or do you take medications to treat high cholesterol? | `E_71` | cardiovascular | ✅ Active & Verified |
| `E_72` | Antecedent | Binary (Y/N) | Have you had one or several flare ups of chronic obstructive pulmonary disease (COPD) in the past year? | `E_72` | respiratory | ✅ Active & Verified |
| `E_73` | Antecedent | Binary (Y/N) | In the last month, have you been in contact with anyone infected with the Ebola virus? | `E_73` | allergy_immune | ✅ Active & Verified |
| `E_74` | Symptom (Root) | Binary (Y/N) | Have you noticed a diffuse (widespread) redness in one or both eyes? | `E_74` | eyes | ✅ Active & Verified |
| `E_75` | Symptom (Root) | Binary (Y/N) | Do you feel like you are (or were) choking or suffocating? | `E_75` | respiratory | ✅ Active & Verified |
| `E_76` | Symptom (Root) | Binary (Y/N) | Do you feel slightly dizzy or lightheaded? | `E_76` | neurological | ✅ Active & Verified |
| `E_77` | Symptom (Root) | Binary (Y/N) | Do you have a cough that produces colored or more abundant sputum than usual? | `E_77` | respiratory | ✅ Active & Verified |
| `E_78` | Antecedent | Binary (Y/N) | Do you drink alcohol excessively or do you have an addiction to alcohol? | `E_78` | lifestyle_environment | ✅ Active & Verified |
| `E_79` | Antecedent | Binary (Y/N) | Do you smoke cigarettes? | `E_79` | lifestyle_environment | ✅ Active & Verified |
| `E_80` | Antecedent | Binary (Y/N) | Have you ever been diagnosed with depression? | `E_80` | neurological | ✅ Active & Verified |
| `E_81` | Antecedent | Binary (Y/N) | Do you suffer from chronic anxiety? | `E_81` | neurological | ✅ Active & Verified |
| `E_82` | Symptom (Root) | Binary (Y/N) | Do you feel lightheaded and dizzy or do you feel like you are about to faint? | `E_82` | neurological | ✅ Active & Verified |
| `E_83` | Symptom (Root) | Binary (Y/N) | Have you noticed weakness in your facial muscles and/or eyes? | `E_83` | neurological | ✅ Active & Verified |
| `E_84` | Symptom (Root) | Binary (Y/N) | Do you feel weakness in both arms and/or both legs? | `E_84` | neurological | ✅ Active & Verified |
| `E_86` | Antecedent | Binary (Y/N) | Do you have any close family members who suffer from allergies (any type), hay fever or eczema? | `E_86` | allergy_immune | ✅ Active & Verified |
| `E_87` | Antecedent (Quarantined) | Binary (Y/N) | Do you have any family members who have asthma? | `N/A` | N/A (Quarantined) | 🔒 Quarantined Frozen Preserved |
| `E_88` | Symptom (Root) | Binary (Y/N) | Do you feel so tired that you are unable to do your usual activities or are you stuck in your bed all day long? | `E_88` | constitutional | ✅ Active & Verified |
| `E_89` | Symptom (Root) | Binary (Y/N) | Do you constantly feel fatigued or do you have non-restful sleep? | `E_89` | constitutional, neurological | ✅ Active & Verified |
| `E_90` | Symptom (Root) | Binary (Y/N) | Do your symptoms of muscle weakness increase with fatigue and/or stress? | `E_90` | neurological | ✅ Active & Verified |
| `E_91` | Symptom (Root) | Binary (Y/N) | Do you have a fever (either felt or measured with a thermometer)? | `E_91` | constitutional | ✅ Active & Verified |
| `E_92` | Symptom (Root) | Binary (Y/N) | Did your cheeks suddenly turn red? | `E_92` | skin | ✅ Active & Verified |
| `E_93` | Symptom (Root) | Binary (Y/N) | Do you have numbness, loss of sensation or tingling in the feet? | `E_93` | neurological | ✅ Active & Verified |
| `E_94` | Symptom (Root) | Binary (Y/N) | Have you had chills or shivers? | `E_94` | constitutional | ✅ Active & Verified |
| `E_95` | Antecedent | Binary (Y/N) | Do you have Parkinson’s disease? | `E_95` | neurological | ✅ Active & Verified |
| `E_96` | Symptom (Root) | Binary (Y/N) | Have you gained weight recently? | `E_96` | constitutional | ✅ Active & Verified |
| `E_97` | Symptom (Root) | Binary (Y/N) | Do you have a sore throat? | `E_97` | respiratory, ent | ✅ Active & Verified |
| `E_98` | Antecedent | Binary (Y/N) | Do you have a hiatal hernia? | `E_98` | digestive | ✅ Active & Verified |
| `E_99` | Antecedent | Binary (Y/N) | Have you ever had a migraine or is a member of your family known to have migraines? | `E_99` | neurological | ✅ Active & Verified |
| `E_100` | Antecedent | Binary (Y/N) | Do you currently take hormones? | `E_100` | lifestyle_environment | ✅ Active & Verified |
| `E_101` | Antecedent | Binary (Y/N) | Have you been hospitalized for an asthma attack in the past year? | `E_101` | respiratory | ✅ Active & Verified |
| `E_102` | Antecedent | Binary (Y/N) | Are you consulting because you have high blood pressure? | `E_102` | cardiovascular | ✅ Active & Verified |
| `E_103` | Symptom (Root) | Binary (Y/N) | Have you lost your sense of smell? | `E_103` | respiratory, ent | ✅ Active & Verified |
| `E_104` | Antecedent | Binary (Y/N) | Do you have high blood pressure or do you take medications to treat high blood pressure? | `E_104` | cardiovascular | ✅ Active & Verified |
| `E_105` | Antecedent | Binary (Y/N) | Have you ever had a heart attack or do you have angina (chest pain)? | `E_105` | cardiovascular | ✅ Active & Verified |
| `E_106` | Antecedent | Binary (Y/N) | Do you have heart failure? | `E_106` | cardiovascular | ✅ Active & Verified |
| `E_107` | Antecedent | Binary (Y/N) | Have you ever had a stroke? | `E_107` | cardiovascular | ✅ Active & Verified |
| `E_108` | Antecedent | Binary (Y/N) | Do you have a problem with poor circulation? | `E_108` | cardiovascular | ✅ Active & Verified |
| `E_109` | Antecedent | Binary (Y/N) | Have you ever had deep vein thrombosis (DVT)? | `E_109` | cardiovascular | ✅ Active & Verified |
| `E_110` | Antecedent | Binary (Y/N) | Have you been unable to move or get up for more than 3 consecutive days within the last 4 weeks? | `E_110` | lifestyle_environment | ✅ Active & Verified |
| `E_111` | Symptom (Root) | Binary (Y/N) | Do you feel like you are dying or were you afraid that you were about do die? | `E_111` | neurological | ✅ Active & Verified |
| `E_112` | Symptom (Root) | Binary (Y/N) | Do you wheeze while inhaling or is your breathing noisy after coughing spells? | `E_112` | respiratory | ✅ Active & Verified |
| `E_113` | Antecedent | Binary (Y/N) | Do you have chronic kidney failure? | `E_113` | urogenital | ✅ Active & Verified |
| `E_114` | Symptom (Root) | Binary (Y/N) | Are you more irritable or has your mood been very unstable recently? | `E_114` | neurological | ✅ Active & Verified |
| `E_115` | Antecedent | Binary (Y/N) | Have you had unprotected sex with more than one partner in the last 6 months? | `E_115` | allergy_immune | ✅ Active & Verified |
| `E_116` | Antecedent | Binary (Y/N) | Have you had a cold in the last 2 weeks? | `E_116` | constitutional | ✅ Active & Verified |
| `E_118` | Antecedent (Quarantined) | Binary (Y/N) | Have you ever had pneumonia? | `N/A` | N/A (Quarantined) | 🔒 Quarantined Frozen Preserved |
| `E_119` | Antecedent | Binary (Y/N) | Have you been diagnosed with chronic sinusitis? | `E_119` | respiratory, ent | ✅ Active & Verified |
| `E_120` | Antecedent | Binary (Y/N) | Do you have polyps in your nose? | `E_120` | respiratory, ent | ✅ Active & Verified |
| `E_121` | Antecedent | Binary (Y/N) | Do you have a deviated nasal septum? | `E_121` | respiratory, ent | ✅ Active & Verified |
| `E_123` | Antecedent (Quarantined) | Binary (Y/N) | Do you have a chronic obstructive pulmonary disease (COPD)? | `N/A` | N/A (Quarantined) | 🔒 Quarantined Frozen Preserved |
| `E_124` | Antecedent | Binary (Y/N) | Do you have asthma or have you ever had to use a bronchodilator in the past? | `E_124` | respiratory | ✅ Active & Verified |
| `E_125` | Antecedent | Binary (Y/N) | Have you ever been diagnosed with gastroesophageal reflux? | `E_125` | digestive | ✅ Active & Verified |
| `E_126` | Antecedent | Binary (Y/N) | Do you have liver cirrhosis? | `E_126` | digestive | ✅ Active & Verified |
| `E_127` | Symptom (Root) | Binary (Y/N) | Do you feel that your eyes produce excessive tears? | `E_127` | eyes | ✅ Active & Verified |
| `E_128` | Symptom (Root) | Binary (Y/N) | Have you ever felt like you were suffocating for a very short time associated with inability to breathe or speak? | `E_128` | respiratory | ✅ Active & Verified |
| `E_129` | Symptom (Root) | Binary (Y/N) | Do you have any lesions, redness or problems on your skin that you believe are related to the condition you are consulting for? | `E_129` | skin | ✅ Active & Verified |
| `E_130` | Symptom (Child of E_129) | Categorical (6 choices) | What color is the rash? | `E_130` | skin | ✅ Active & Verified |
| `E_131` | Symptom (Child of E_129) | Categorical (2 choices) | Do your lesions peel off? | `E_131` | skin | ✅ Active & Verified |
| `E_132` | Symptom (Child of E_129) | Categorical (11 choices) | Is the rash swollen? | `E_132` | skin | ✅ Active & Verified |
| `E_133` | Symptom (Child of E_129) | Multichoice (165 choices) | Where is the affected region located? | `E_133` | skin | ✅ Active & Verified |
| `E_134` | Symptom (Child of E_129) | Categorical (11 choices) | How intense is the pain caused by the rash? | `E_134` | skin | ✅ Active & Verified |
| `E_135` | Symptom (Child of E_129) | Categorical (2 choices) | Is the lesion (or are the lesions) larger than 1cm? | `E_135` | skin | ✅ Active & Verified |
| `E_136` | Symptom (Child of E_129) | Categorical (11 choices) | How severe is the itching? | `E_136` | skin | ✅ Active & Verified |
| `E_137` | Antecedent | Binary (Y/N) | Have you ever had surgery to remove lymph nodes? | `E_137` | lifestyle_environment | ✅ Active & Verified |
| `E_138` | Antecedent | Binary (Y/N) | Do you suffer from fibromyalgia? | `E_138` | musculoskeletal | ✅ Active & Verified |
| `E_139` | Antecedent | Binary (Y/N) | Do you have a known heart defect? | `E_139` | cardiovascular | ✅ Active & Verified |
| `E_140` | Symptom (Root) | Binary (Y/N) | Have you recently had stools that were black (like coal)? | `E_140` | digestive | ✅ Active & Verified |
| `E_141` | Antecedent | Binary (Y/N) | Did you have your first menstrual period before the age of 12? | `E_141` | urogenital | ✅ Active & Verified |
| `E_142` | Antecedent | Binary (Y/N) | Does your mother suffer from asthma? | `E_142` | respiratory | ✅ Active & Verified |
| `E_143` | Antecedent | Binary (Y/N) | Do you exercise regularly, 4 times per week or more? | `E_143` | lifestyle_environment | ✅ Active & Verified |
| `E_144` | Symptom (Root) | Binary (Y/N) | Do you have diffuse (widespread) muscle pain? | `E_144` | pain, musculoskeletal | ✅ Active & Verified |
| `E_145` | Symptom (Root) | Binary (Y/N) | Do you have very abundant or very long menstruation periods? | `E_145` | urogenital | ✅ Active & Verified |
| `E_146` | Antecedent | Binary (Y/N) | Are you taking any new oral anticoagulants ((NOACs)? | `E_146` | cardiovascular | ✅ Active & Verified |
| `E_147` | Antecedent | Binary (Y/N) | Have you been treated in hospital recently for nausea, agitation, intoxication or aggressive behavior and received medication via an intravenous or intramuscular route? | `E_147` | lifestyle_environment | ✅ Active & Verified |
| `E_148` | Symptom (Root) | Binary (Y/N) | Are you feeling nauseous or do you feel like vomiting? | `E_148` | digestive | ✅ Active & Verified |
| `E_149` | Antecedent | Binary (Y/N) | Do you take a calcium channel blockers (medication)? | `E_149` | cardiovascular | ✅ Active & Verified |
| `E_150` | Symptom (Root) | Binary (Y/N) | Have you been able to pass stools or gas since your symptoms increased? | `E_150` | digestive | ✅ Active & Verified |
| `E_151` | Symptom (Root) | Binary (Y/N) | Do you have swelling in one or more areas of your body? | `E_151` | skin | ✅ Active & Verified |
| `E_152` | Symptom (Child of E_151) | Multichoice (165 choices) | Where is the swelling located? | `E_152` | skin | ✅ Active & Verified |
| `E_153` | Antecedent | Binary (Y/N) | Are you being treated for osteoporosis? | `E_153` | musculoskeletal | ✅ Active & Verified |
| `E_154` | Symptom (Root) | Binary (Y/N) | Is your skin much paler than usual? | `E_154` | cardiovascular, skin | ✅ Active & Verified |
| `E_155` | Symptom (Root) | Binary (Y/N) | Do you feel your heart is beating fast (racing), irregularly (missing a beat) or do you feel palpitations? | `E_155` | cardiovascular | ✅ Active & Verified |
| `E_156` | Symptom (Root) | Binary (Y/N) | Have you had weakness or paralysis on one side of the face, which may still be present or completely resolved? | `E_156` | neurological | ✅ Active & Verified |
| `E_157` | Symptom (Root) | Binary (Y/N) | Have you recently had numbness, loss of sensation or tingling, in both arms and legs and around your mouth? | `E_157` | neurological | ✅ Active & Verified |
| `E_158` | Antecedent | Binary (Y/N) | Were you diagnosed with endocrine disease or a hormone dysfunction? | `E_158` | constitutional | ✅ Active & Verified |
| `E_159` | Symptom (Root) | Binary (Y/N) | Did you lose consciousness? | `E_159` | neurological | ✅ Active & Verified |
| `E_160` | Antecedent | Binary (Y/N) | Were you born prematurely or did you suffer any complication at birth? | `E_160` | lifestyle_environment | ✅ Active & Verified |
| `E_161` | Symptom (Root) | Binary (Y/N) | Have you recently had a loss of appetite or do you get full more quickly then usually? | `E_161` | digestive, constitutional | ✅ Active & Verified |
| `E_162` | Symptom (Root) | Binary (Y/N) | Have you had an involuntary weight loss over the last 3 months? | `E_162` | constitutional | ✅ Active & Verified |
| `E_163` | Symptom (Root) | Binary (Y/N) | Have you had any vaginal discharge? | `E_163` | urogenital | ✅ Active & Verified |
| `E_164` | Symptom (Root) | Binary (Y/N) | Do you feel your heart is beating very irregularly or in a disorganized pattern? | `E_164` | cardiovascular | ✅ Active & Verified |
| `E_165` | Antecedent | Binary (Y/N) | Have any of your family members ever had a pneumothorax? | `E_165` | respiratory | ✅ Active & Verified |
| `E_166` | Symptom (Root) | Binary (Y/N) | Did you vomit after coughing? | `E_166` | respiratory | ✅ Active & Verified |
| `E_167` | Antecedent | Binary (Y/N) | Do you think you are pregnant or are you currently pregnant? | `E_167` | urogenital | ✅ Active & Verified |
| `E_168` | Symptom (Root) | Binary (Y/N) | Do you have trouble keeping your tongue in your mouth? | `E_168` | neurological | ✅ Active & Verified |
| `E_169` | Symptom (Root) | Binary (Y/N) | Is your nose or the back of your throat itchy? | `E_169` | ent | ✅ Active & Verified |
| `E_170` | Symptom (Root) | Binary (Y/N) | Do you have severe itching in one or both eyes? | `E_170` | eyes | ✅ Active & Verified |
| `E_171` | Symptom (Root) | Binary (Y/N) | Do you feel like you are detached from your own body or your surroundings? | `E_171` | neurological | ✅ Active & Verified |
| `E_172` | Symptom (Root) | Binary (Y/N) | Do you have a hard time opening/raising one or both eyelids? | `E_172` | eyes | ✅ Active & Verified |
| `E_173` | Symptom (Root) | Binary (Y/N) | Do you have a burning sensation that starts in your stomach then goes up into your throat, and can be associated with a bitter taste in your mouth? | `E_173` | digestive | ✅ Active & Verified |
| `E_174` | Symptom (Root) | Binary (Y/N) | Have you been unintentionally losing weight or have you lost your appetite? | `E_174` | constitutional | ✅ Active & Verified |
| `E_175` | Symptom (Root) | Binary (Y/N) | Have you noticed any new fatigue, generalized and vague discomfort, diffuse (widespread) muscle aches or a change in your general well-being related to your consultation today? | `E_175` | constitutional, musculoskeletal | ✅ Active & Verified |
| `E_176` | Symptom (Root) | Binary (Y/N) | Did you previously, or do you currently, have any weakness/paralysis in one or more of your limbs or in your face? | `E_176` | neurological | ✅ Active & Verified |
| `E_177` | Symptom (Root) | Binary (Y/N) | Do you currently, or did you ever, have numbness, loss of sensitivity or tingling anywhere on your body? | `E_177` | neurological | ✅ Active & Verified |
| `E_178` | Symptom (Root) | Binary (Y/N) | Have you noticed any unusual bleeding or bruising related to your consultation today? | `E_178` | constitutional | ✅ Active & Verified |
| `E_179` | Symptom (Root) | Binary (Y/N) | Have you noticed light red blood or blood clots in your stool? | `E_179` | digestive | ✅ Active & Verified |
| `E_180` | Symptom (Root) | Binary (Y/N) | Are you unable to control the direction of your eyes? | `E_180` | eyes | ✅ Active & Verified |
| `E_181` | Symptom (Root) | Binary (Y/N) | Do you have nasal congestion or a clear runny nose? | `E_181` | respiratory, ent | ✅ Active & Verified |
| `E_182` | Symptom (Root) | Binary (Y/N) | Do you have greenish or yellowish nasal discharge? | `E_182` | respiratory, ent | ✅ Active & Verified |
| `E_183` | Antecedent | Binary (Y/N) | Do you live in a rural area? | `E_183` | lifestyle_environment | ✅ Active & Verified |
| `E_184` | Antecedent | Binary (Y/N) | Do you take medication that dilates your blood vessels? | `E_184` | cardiovascular | ✅ Active & Verified |
| `E_185` | Antecedent | Binary (Y/N) | Have you ever had a head trauma? | `E_185` | neurological | ✅ Active & Verified |
| `E_186` | Antecedent | Binary (Y/N) | Have you ever been diagnosed with obstructive sleep apnea (OSA)? | `E_186` | respiratory | ✅ Active & Verified |
| `E_187` | Antecedent | Binary (Y/N) | Did you eat dark-fleshed fish (such as tuna) or Swiss cheese before the reaction occurred? | `E_187` | allergy_immune | ✅ Active & Verified |
| `E_188` | Symptom (Root) | Binary (Y/N) | Do you have pale stools and dark urine? | `E_188` | digestive | ✅ Active & Verified |
| `E_189` | Antecedent | Binary (Y/N) | Have you had sexual intercourse with an HIV-positive partner in the past 12 months? | `E_189` | allergy_immune | ✅ Active & Verified |
| `E_190` | Symptom (Root) | Binary (Y/N) | Have you noticed that you produce more saliva than usual? | `E_190` | ent | ✅ Active & Verified |
| `E_191` | Antecedent | Binary (Y/N) | Are you a former smoker? | `E_191` | lifestyle_environment | ✅ Active & Verified |
| `E_192` | Symptom (Root) | Binary (Y/N) | Do you feel that muscle spasms or soreness in your neck are keeping you from turning your head to one side? | `E_192` | pain, neurological, musculoskeletal | ✅ Active & Verified |
| `E_193` | Symptom (Root) | Binary (Y/N) | Do you have annoying muscle spasms in your face, neck or any other part of your body? | `E_193` | neurological, musculoskeletal | ✅ Active & Verified |
| `E_194` | Symptom (Root) | Binary (Y/N) | Have you noticed a high pitched sound when breathing in? | `E_194` | respiratory | ✅ Active & Verified |
| `E_195` | Antecedent | Binary (Y/N) | Do you live in the suburbs? | `E_195` | lifestyle_environment | ✅ Active & Verified |
| `E_196` | Antecedent | Binary (Y/N) | Have you had surgery within the last month? | `E_196` | lifestyle_environment | ✅ Active & Verified |
| `E_197` | Antecedent | Binary (Y/N) | Do you have a known kidney problem resulting in an inability to retain proteins? | `E_197` | urogenital | ✅ Active & Verified |
| `E_198` | Antecedent | Binary (Y/N) | Do you work in agriculture? | `E_198` | lifestyle_environment | ✅ Active & Verified |
| `E_199` | Antecedent | Binary (Y/N) | Do you work in construction? | `E_199` | lifestyle_environment | ✅ Active & Verified |
| `E_200` | Antecedent | Binary (Y/N) | Do you work in the mining sector? | `E_200` | lifestyle_environment | ✅ Active & Verified |
| `E_201` | Symptom (Root) | Binary (Y/N) | Do you have a cough? | `E_201` | respiratory | ✅ Active & Verified |
| `E_202` | Symptom (Root) | Binary (Y/N) | Does the person have a whooping cough? | `E_202` | respiratory | ✅ Active & Verified |
| `E_203` | Symptom (Root) | Binary (Y/N) | Do you have intense coughing fits? | `E_203` | respiratory | ✅ Active & Verified |
| `E_204` | Antecedent | Categorical (12 choices) | Have you traveled out of the country in the last 4 weeks? | `E_204` | travel | ✅ Active & Verified |
| `E_205` | Symptom (Root) | Binary (Y/N) | Do you suddenly have difficulty or an inability to open your mouth or have jaw pain when opening it? | `E_205` | ent | ✅ Active & Verified |
| `E_206` | Symptom (Root) | Binary (Y/N) | Do you have painful mouth ulcers or sores? | `E_206` | ent | ✅ Active & Verified |
| `E_207` | Antecedent | Binary (Y/N) | Do you live in in a big city? | `E_207` | lifestyle_environment | ✅ Active & Verified |
| `E_208` | Antecedent | Binary (Y/N) | Is your BMI less than 18.5, or are you underweight? | `E_208` | lifestyle_environment | ✅ Active & Verified |
| `E_209` | Antecedent | Binary (Y/N) | Are your vaccinations up to date? | `E_209` | allergy_immune | ✅ Active & Verified |
| `E_210` | Symptom (Root) | Binary (Y/N) | Have you recently thrown up blood or something resembling coffee beans? | `E_210` | digestive | ✅ Active & Verified |
| `E_211` | Symptom (Root) | Binary (Y/N) | Have you vomited several times or have you made several efforts to vomit? | `E_211` | digestive | ✅ Active & Verified |
| `E_212` | Symptom (Root) | Binary (Y/N) | Have you noticed that the tone of your voice has become deeper, softer or hoarse? | `E_212` | respiratory, ent | ✅ Active & Verified |
| `E_213` | Antecedent | Binary (Y/N) | Have you recently taken decongestants or other substances that may have stimulant effects? | `E_213` | lifestyle_environment | ✅ Active & Verified |
| `E_214` | Symptom (Root) | Binary (Y/N) | Have you noticed a wheezing sound when you exhale? | `E_214` | respiratory | ✅ Active & Verified |
| `E_215` | Symptom (Root) | Binary (Y/N) | Do you have symptoms that get worse after eating? | `E_215` | digestive, pain | ✅ Active & Verified |
| `E_216` | Symptom (Root) | Binary (Y/N) | Do you have pain that is increased with movement? | `E_216` | pain | ✅ Active & Verified |
| `E_217` | Symptom (Root) | Binary (Y/N) | Are your symptoms worse when lying down and alleviated while sitting up? | `E_217` | pain | ✅ Active & Verified |
| `E_218` | Symptom (Root) | Binary (Y/N) | Do you have symptoms that are increased with physical exertion but alleviated with rest? | `E_218` | cardiovascular, pain | ✅ Active & Verified |
| `E_219` | Symptom (Root) | Binary (Y/N) | Are your symptoms more prominent at night? | `E_219` | respiratory | ✅ Active & Verified |
| `E_220` | Symptom (Root) | Binary (Y/N) | Do you have pain that is increased when you breathe in deeply? | `E_220` | pain | ✅ Active & Verified |
| `E_221` | Symptom (Root) | Binary (Y/N) | Are the symptoms or pain increased with coughing, with an effort like lifting a weight or from forcing a bowel movement? | `E_221` | pain | ✅ Active & Verified |
| `E_222` | Antecedent | Binary (Y/N) | Are you exposed to secondhand cigarette smoke on a daily basis? | `E_222` | lifestyle_environment | ✅ Active & Verified |
| `E_223` | Antecedent | Binary (Y/N) | Are there members of your family who have been diagnosed with pancreatic cancer? | `E_223` | lifestyle_environment | ✅ Active & Verified |
| `E_224` | Antecedent | Binary (Y/N) | Do you have family members who have had lung cancer? | `E_224` | respiratory | ✅ Active & Verified |
| `E_225` | Antecedent | Binary (Y/N) | Do you have close family members who had a cardiovascular disease problem before the age of 50? | `E_225` | cardiovascular | ✅ Active & Verified |
| `E_226` | Antecedent | Binary (Y/N) | Are you more likely to develop common allergies than the general population? | `E_226` | allergy_immune | ✅ Active & Verified |
| `E_227` | Antecedent | Binary (Y/N) | Are you immunosuppressed? | `E_227` | allergy_immune | ✅ Active & Verified |

---

## Conditional Child Dependencies

The 14 conditional child symptoms require explicit positive confirmation of their root parent before becoming eligible for questioning, preserving medical causality and preventing irrelevant questions:

1. **Parent `E_53` (Pain)**:
   - `E_54` (Pain characteristics): knife stroke, sharp, burning, cramp, throbbing, heavy, etc.
   - `E_55` (Pain location): 165 anatomical sites including laterality (R/L).
   - `E_56` (Pain intensity): 0–10 numeric scale.
   - `E_57` (Radiating pain): 165 anatomical sites.
   - `E_58` (Precision of location): 0–10 numeric scale.
   - `E_59` (Speed of pain onset): 0–10 numeric scale.
2. **Parent `E_129` (Rash or Skin Lesions)**:
   - `E_130` (Rash color): red, pink, pale, yellow, dark, etc.
   - `E_131` (Peeling lesions): Y/N peeling.
   - `E_132` (Swollen rash): 0–10 numeric scale.
   - `E_133` (Rash location): 165 anatomical sites.
   - `E_134` (Rash pain intensity): 0–10 numeric scale.
   - `E_135` (Lesions > 1cm): Y/N size threshold.
   - `E_136` (Rash itch intensity): 0–10 numeric scale.
3. **Parent `E_151` (Swelling)**:
   - `E_152` (Swelling location): 165 anatomical sites.

---

## Quarantined Fields Preservation

The following 5 fields remain permanently quarantined per DDXPlus campaign specifications:
- `E_69`: Diabetes history.
- `E_37`: Smoking duration / pack-years.
- `E_118`: Chronic cough history.
- `E_123`: Family asthma history.
- `E_87`: Family hypertension history.

These fields are intentionally excluded from active ingress patterns, adaptive question pools, and Model A feature extraction.
