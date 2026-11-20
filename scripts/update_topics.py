# scripts/update_topics.py
import json
import re
from pathlib import Path

meta = json.loads(Path("models/medassist_ai/docs/symptom-schema-metadata.json").read_text(encoding="utf-8"))
quarantined_ids = {"E_69", "E_37", "E_118", "E_123", "E_87"}
active_items = {i["evidence_id"]: i for i in meta["items"] if i["evidence_id"] not in quarantined_ids}

# Categorize all 218 active items into clinical topics:
topics = {
    "respiratory": [
        "E_66", "E_201", "E_203", "E_77", "E_112", "E_202", "E_166", "E_219", "E_181", "E_182",
        "E_97", "E_212", "E_103", "E_64", "E_45", "E_194", "E_214", "E_67", "E_23", "E_124",
        "E_101", "E_46", "E_142", "E_31", "E_72", "E_18", "E_165", "E_21", "E_186", "E_5",
        "E_4", "E_119", "E_120", "E_121", "E_40", "E_224", "E_75", "E_128"
    ],
    "digestive": [
        "E_51", "E_148", "E_211", "E_30", "E_32", "E_161", "E_150", "E_173", "E_210", "E_140",
        "E_179", "E_188", "E_215", "E_125", "E_98", "E_47", "E_6", "E_126"
    ],
    "cardiovascular": [
        "E_155", "E_164", "E_14", "E_13", "E_218", "E_154", "E_102", "E_104", "E_71", "E_105",
        "E_106", "E_107", "E_108", "E_109", "E_139", "E_22", "E_3", "E_146", "E_149", "E_184",
        "E_225"
    ],
    "skin": [
        "E_129", "E_130", "E_131", "E_132", "E_133", "E_134", "E_135", "E_136", "E_151", "E_152",
        "E_154", "E_92"
    ],
    "constitutional": [
        "E_91", "E_94", "E_50", "E_175", "E_89", "E_88", "E_32", "E_161", "E_162", "E_174",
        "E_96", "E_0", "E_116", "E_9", "E_178", "E_19", "E_158"
    ],
    "pain": [
        "E_53", "E_54", "E_55", "E_56", "E_57", "E_58", "E_59", "E_144", "E_216", "E_220",
        "E_221", "E_215", "E_217", "E_218", "E_33", "E_38", "E_192"
    ],
    "neurological": [
        "E_76", "E_82", "E_159", "E_43", "E_177", "E_93", "E_157", "E_52", "E_90", "E_89",
        "E_156", "E_83", "E_176", "E_84", "E_168", "E_192", "E_193", "E_39", "E_171", "E_111",
        "E_95", "E_99", "E_25", "E_28", "E_185", "E_80", "E_16", "E_81", "E_29", "E_114"
    ],
    "eyes": [
        "E_74", "E_127", "E_170", "E_172", "E_180", "E_52"
    ],
    "ent": [
        "E_97", "E_181", "E_182", "E_103", "E_212", "E_65", "E_205", "E_63", "E_190", "E_206",
        "E_169", "E_1", "E_119", "E_120", "E_121"
    ],
    "musculoskeletal": [
        "E_144", "E_175", "E_192", "E_193", "E_38", "E_20", "E_138", "E_153"
    ],
    "urogenital": [
        "E_163", "E_145", "E_167", "E_141", "E_11", "E_113", "E_8", "E_197"
    ],
    "allergy_immune": [
        "E_42", "E_226", "E_12", "E_86", "E_187", "E_2", "E_189", "E_227", "E_27", "E_115",
        "E_73", "E_41", "E_209"
    ],
    "lifestyle_environment": [
        "E_79", "E_191", "E_222", "E_78", "E_60", "E_35", "E_61", "E_62", "E_213", "E_10",
        "E_44", "E_15", "E_100", "E_196", "E_137", "E_147", "E_110", "E_143", "E_7", "E_70",
        "E_208", "E_198", "E_199", "E_200", "E_207", "E_195", "E_183", "E_48", "E_49", "E_17",
        "E_160", "E_24", "E_26", "E_34", "E_223"
    ],
    "travel": [
        "E_204"
    ]
}

# Verify coverage
all_covered = set()
for t_ids in topics.values():
    all_covered.update(t_ids)

missing = [eid for eid in active_items if eid not in all_covered]
print("Active items count:", len(active_items))
print("Covered items count:", len(all_covered))
print("Missing items:", len(missing), missing)

# Ensure no quarantined items included
for q in quarantined_ids:
    assert q not in all_covered, f"Quarantined item {q} found in topics!"

# Write symptom-topic-memberships.json
output_data = {
    "schema_version": "medassist.topics-audit.v2",
    "clinically_validated": False,
    "topics": {k: sorted(list(v), key=lambda x: int(x[2:])) for k, v in topics.items()}
}

Path("models/medassist_ai/docs/symptom-topic-memberships.json").write_text(
    json.dumps(output_data, indent=2) + "\n", encoding="utf-8"
)
print("Updated models/medassist_ai/docs/symptom-topic-memberships.json")
