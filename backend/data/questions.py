DIMENSIONS = [
    "procedural",
    "patient_interaction",
    "work_life_balance",
    "stress_tolerance",
    "manual_dexterity",
    "academic",
    "emergency",
    "tech_affinity",
    "income",
    "stamina",
]

# ---------------------------------------------------------------------------
# DESIGN NOTES (why this set is more stable than the previous 35)
#   1. No comparative framing ("X more than Y"). Each item probes ONE concept.
#      Relative preference is recovered by the mean-centered scorer, not by
#      forcing the respondent to weigh two options in their head.
#   2. No double-barreled items (no "A or B" joined into one statement).
#   3. No hypotheticals / conditionals ("I would... if..."). All items are
#      present-tense trait statements, which drift far less day-to-day.
#   4. Exactly one reverse-scored item per dimension (two for work_life_balance)
#      to catch straight-lining / careless responding.
#
#   SCALE ASSUMPTION: raw 5 = "Strongly agree", raw 1 = "Strongly disagree".
#   Reverse scoring is adj = 6 - raw. This ONLY works if the frontend SCALE
#   array sends v:5 for "Strongly agree". Fix that mismatch before testing.
# ---------------------------------------------------------------------------

QUESTIONS = [
    # ── Procedural (4) ──────────────────────────────────────────────────────
    {
        "id": 1,
        "text": "I enjoy performing hands-on procedures.",
        "dimension": "procedural",
        "reverse": False,
    },
    {
        "id": 2,
        "text": "Doing a physical task skillfully gives me a strong sense of satisfaction.",
        "dimension": "procedural",
        "reverse": False,
    },
    {
        "id": 3,
        "text": "I look forward to work that involves operating, suturing, or other manual interventions.",
        "dimension": "procedural",
        "reverse": False,
    },
    {
        "id": 4,
        "text": "A role built mostly around hands-on procedures would leave me unfulfilled.",
        "dimension": "procedural",
        "reverse": True,
    },

    # ── Patient interaction (4) ──────────────────────────────────────────────
    {
        "id": 5,
        "text": "Long conversations with patients and their families energize me.",
        "dimension": "patient_interaction",
        "reverse": False,
    },
    {
        "id": 6,
        "text": "Building long-term relationships with patients matters deeply to me.",
        "dimension": "patient_interaction",
        "reverse": False,
    },
    {
        "id": 7,
        "text": "Counseling patients through difficult emotional situations comes naturally to me.",
        "dimension": "patient_interaction",
        "reverse": False,
    },
    {
        "id": 8,
        "text": "I would prefer a role where I spend most of my time away from direct patient contact.",
        "dimension": "patient_interaction",
        "reverse": True,
    },

    # ── Work-life balance (4) ────────────────────────────────────────────────
    {
        "id": 9,
        "text": "Predictable working hours are very important to my quality of life.",
        "dimension": "work_life_balance",
        "reverse": False,
    },
    {
        "id": 10,
        "text": "Having time for family, hobbies, and rest strongly influences my career choices.",
        "dimension": "work_life_balance",
        "reverse": False,
    },
    {
        "id": 11,
        "text": "I am willing to give up personal time on a regular basis for my work.",
        "dimension": "work_life_balance",
        "reverse": True,
    },
    {
        "id": 12,
        "text": "I am comfortable being on call through nights and weekends.",
        "dimension": "work_life_balance",
        "reverse": True,
    },

    # ── Stress tolerance (4) ────────────────────────────────────────────────
    {
        "id": 13,
        "text": "I stay composed when the pressure is high and decisions must be made quickly.",
        "dimension": "stress_tolerance",
        "reverse": False,
    },
    {
        "id": 14,
        "text": "I remain focused when managing several critical patients at once.",
        "dimension": "stress_tolerance",
        "reverse": False,
    },
    {
        "id": 15,
        "text": "I handle uncertainty and unpredictability in my work well.",
        "dimension": "stress_tolerance",
        "reverse": False,
    },
    {
        "id": 16,
        "text": "Sustained high-pressure situations leave me drained and unsettled.",
        "dimension": "stress_tolerance",
        "reverse": True,
    },

    # ── Manual dexterity (4) ────────────────────────────────────────────────
    {
        "id": 17,
        "text": "I am confident in my fine motor skills and hand-eye coordination.",
        "dimension": "manual_dexterity",
        "reverse": False,
    },
    {
        "id": 18,
        "text": "I can perform delicate, detailed physical tasks accurately.",
        "dimension": "manual_dexterity",
        "reverse": False,
    },
    {
        "id": 19,
        "text": "Precise handwork is something I do well and trust myself with.",
        "dimension": "manual_dexterity",
        "reverse": False,
    },
    {
        "id": 20,
        "text": "Tasks requiring very fine, steady hand control are difficult for me.",
        "dimension": "manual_dexterity",
        "reverse": True,
    },

    # ── Academic / research (4) ──────────────────────────────────────────────
    {
        "id": 21,
        "text": "I enjoy reading research papers and keeping up with clinical literature.",
        "dimension": "academic",
        "reverse": False,
    },
    {
        "id": 22,
        "text": "Teaching or mentoring junior doctors appeals to me.",
        "dimension": "academic",
        "reverse": False,
    },
    {
        "id": 23,
        "text": "Understanding the underlying mechanism of a disease fascinates me.",
        "dimension": "academic",
        "reverse": False,
    },
    {
        "id": 24,
        "text": "I have little interest in the research side of medicine.",
        "dimension": "academic",
        "reverse": True,
    },

    # ── Emergency readiness (4) ──────────────────────────────────────────────
    {
        "id": 25,
        "text": "I thrive in acute emergencies that demand split-second decisions.",
        "dimension": "emergency",
        "reverse": False,
    },
    {
        "id": 26,
        "text": "Fast-paced, high-adrenaline environments motivate me.",
        "dimension": "emergency",
        "reverse": False,
    },
    {
        "id": 27,
        "text": "I am comfortable making life-or-death decisions under time pressure.",
        "dimension": "emergency",
        "reverse": False,
    },
    {
        "id": 28,
        "text": "I would rather avoid work centered on acute emergencies.",
        "dimension": "emergency",
        "reverse": True,
    },

    # ── Tech affinity (4) ────────────────────────────────────────────────────
    {
        "id": 29,
        "text": "Working with advanced medical equipment and imaging fascinates me.",
        "dimension": "tech_affinity",
        "reverse": False,
    },
    {
        "id": 30,
        "text": "I enjoy understanding how medical devices work at a technical level.",
        "dimension": "tech_affinity",
        "reverse": False,
    },
    {
        "id": 31,
        "text": "A role where technology is central to daily work appeals to me.",
        "dimension": "tech_affinity",
        "reverse": False,
    },
    {
        "id": 32,
        "text": "I have little interest in the technical or equipment side of medicine.",
        "dimension": "tech_affinity",
        "reverse": True,
    },

    # ── Income priority (4) ──────────────────────────────────────────────────
    {
        "id": 33,
        "text": "High earning potential strongly influences my specialty choice.",
        "dimension": "income",
        "reverse": False,
    },
    {
        "id": 34,
        "text": "Financial security is a top priority in my career decisions.",
        "dimension": "income",
        "reverse": False,
    },
    {
        "id": 35,
        "text": "Private practice income potential matters a great deal to me.",
        "dimension": "income",
        "reverse": False,
    },
    {
        "id": 36,
        "text": "Income is only a minor factor in how I choose my specialty.",
        "dimension": "income",
        "reverse": True,
    },

    # ── Physical stamina (4) ─────────────────────────────────────────────────
    {
        "id": 37,
        "text": "I can stay on my feet and stay focused for many hours without difficulty.",
        "dimension": "stamina",
        "reverse": False,
    },
    {
        "id": 38,
        "text": "Physically demanding shifts do not intimidate me.",
        "dimension": "stamina",
        "reverse": False,
    },
    {
        "id": 39,
        "text": "I recover quickly and stay motivated after an intense, exhausting shift.",
        "dimension": "stamina",
        "reverse": False,
    },
    {
        "id": 40,
        "text": "Long hours of physical work wear me down quickly.",
        "dimension": "stamina",
        "reverse": True,
    },
]