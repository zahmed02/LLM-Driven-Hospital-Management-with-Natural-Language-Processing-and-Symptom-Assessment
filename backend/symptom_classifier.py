"""
Symptom-to-specialty classification for the AI assistant.

WHY THIS EXISTS
----------------
Language detection (backend/nlp_service.py) solves "what language is the
user writing in" - it says nothing about "which of our ACTUAL hospital
departments does this complaint belong to". That second question was
left entirely to the LLM's own free-form medical judgment, and in
testing that produced real inconsistencies on the same input across
different runs:
  - "میرا سر میں درد ہے" (a headache) was once routed to a CARDIOLOGIST
    (Dr. Emily Johnson) and once, correctly, to Neurology.
  - "I have a bad headache" prompted the assistant to offer "neurology or
    PRIMARY CARE" - but this hospital has no Primary Care department at
    all (only Cardiology, Dermatology, Neurology, Orthopedics,
    Pediatrics exist) - an invented option a patient could act on.

This module performs that classification explicitly and deterministically
in code, the same technique family as nlp_service.py: tokenization +
weighted lexicon/phrase matching, scored per specialty. It is deliberately
PHRASE-based, not pure single-word bag-of-words, because the real signal
is often a multi-word medical phrase ("chest pain", "sar dard") while a
bare generic word like "dard"/"pain" alone is too ambiguous to route
anywhere by itself and is intentionally excluded from every lexicon.

This does NOT replace the LLM's judgment or diagnose anything - it
produces a *suggestion* with a confidence score that chat_router.py
injects into the system prompt as grounding context ("symptom analysis
suggests X department"), which the model can use, override, or ask a
clarifying question about. The model still must call search_doctors to
confirm which real doctors exist before naming any - this only stops it
from defaulting to whichever doctor was recently discussed, or inventing
a department that doesn't exist.
"""
from typing import Optional

# Only specialties that ACTUALLY exist in this hospital. Never add a
# specialty here that isn't a real department - the whole point is to
# stop the assistant from inventing options like "primary care".
SPECIALTY_LEXICON = {
    "Cardiology": [
        # English
        "chest pain", "chest pressure", "heart pain", "heart attack",
        "palpitation", "palpitations", "irregular heartbeat", "racing heart",
        "high blood pressure", "high bp", "shortness of breath",
        "cardiac", "cardiologist", "heart condition", "heart problem",
        # Roman Urdu
        "seenay mein dard", "sine mein dard", "dil ka dard", "dil mein dard",
        "dil ki dhadkan", "dhadkan tez", "dil ka masla", "dil ka problem",
        "saans phoolna", "saans ki takleef",
    ],
    "Dermatology": [
        # English
        "skin rash", "rash on", "skin allergy", "acne", "pimples",
        "eczema", "itchy skin", "skin infection", "mole", "skin condition",
        "dermatologist",
        # Roman Urdu
        "jild ki bimari", "jild par", "khujli", "daane nikal", "jild mein",
        "chehre par daane",
    ],
    "Neurology": [
        # English
        "headache", "migraine", "head hurts", "head pain", "dizziness",
        "dizzy", "feeling dizzy", "seizure", "numbness", "tremor",
        "memory loss", "neurologist", "fainting",
        # Roman Urdu
        "sar dard", "sar mein dard", "sar dukh", "sar mein dukh",
        "chakkar", "chakkar aa", "sar ghoom", "mirgi", "yaadash",
        "sar bohat dard", "meray sar",
    ],
    "Orthopedics": [
        # English
        "back pain", "knee pain", "joint pain", "bone pain", "fracture",
        "sprain", "shoulder pain", "arthritis", "hip pain", "spine",
        "broken bone", "orthopedic", "orthopedist",
        # Roman Urdu
        "kamar dard", "kamar mein dard", "ghutne mein dard", "ghutna dard",
        "haddi tootna", "haddi ka dard", "jor mein dard", "mochh",
    ],
    "Pediatrics": [
        # English
        "my baby", "my infant", "my child", "my kid", "my toddler",
        "newborn", "pediatrician", "paediatrician",
        # Roman Urdu
        "mera bacha", "meri bachi", "bachay ko", "bachay ki", "shirkhwar",
        "nawzaida",
    ],
}


def classify_symptom(text: str):
    """
    Returns (specialty, confidence, matched_phrases) for the best-matching
    specialty, or (None, 0.0, []) if nothing in the lexicon matched.
    confidence is a simple normalized score in (0, 1] - the winning
    specialty's match count relative to total matches across all
    specialties (1.0 = every match pointed to one specialty).
    """
    if not text or not text.strip():
        return None, 0.0, []

    lowered = text.lower()
    scores = {}
    matches = {}

    for specialty, phrases in SPECIALTY_LEXICON.items():
        hits = [p for p in phrases if p in lowered]
        if hits:
            scores[specialty] = len(hits)
            matches[specialty] = hits

    if not scores:
        return None, 0.0, []

    total = sum(scores.values())
    best_specialty = max(scores, key=scores.get)
    confidence = scores[best_specialty] / total

    return best_specialty, confidence, matches[best_specialty]


def build_symptom_hint(text: str) -> Optional[str]:
    """
    Returns a short grounding line to inject into the system prompt, or
    None if no symptom language was detected. Kept as a *suggestion*,
    never a directive to name a specific doctor - the model must still
    verify via search_doctors.
    """
    specialty, confidence, matched = classify_symptom(text)
    if not specialty or confidence < 0.5:
        return None

    return (
        f"Symptom analysis of the user's message suggests this may relate to "
        f"the {specialty} department (matched: {', '.join(matched[:3])}). "
        f"If the user is describing a medical concern, treat this as a starting "
        f"point - confirm with search_doctors(specialty=\"{specialty}\") before "
        f"naming any doctor, and only suggest departments that tool actually "
        f"returns results for. Never suggest a department that isn't one of "
        f"this hospital's real specialties."
    )
