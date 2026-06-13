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

QUESTIONS = [
    # ── Procedural (4) ──────────────────────────────────────────────────────
    {
        "id": 1,
        "text": "I enjoy performing hands-on procedures more than sitting and analyzing data.",
        "dimension": "procedural",
        "reverse": False,
    },
    {
        "id": 2,
        "text": "I get more satisfaction from doing a physical task skillfully than from solving a diagnostic puzzle.",
        "dimension": "procedural",
        "reverse": False,
    },
    {
        "id": 3,
        "text": "Working with instruments and tools excites me more than reading or thinking.",
        "dimension": "procedural",
        "reverse": False,
    },
    {
        "id": 4,
        "text": "I prefer a career where I'm thinking and reasoning deeply over one where I'm operating or cutting.",
        "dimension": "procedural",
        "reverse": True,
    },

    # ── Patient interaction (4) ──────────────────────────────────────────────
    {
        "id": 5,
        "text": "I find long conversations with patients and their families energizing, not draining.",
        "dimension": "patient_interaction",
        "reverse": False,
    },
    {
        "id": 6,
        "text": "Building long-term relationships with patients is something I deeply value.",
        "dimension": "patient_interaction",
        "reverse": False,
    },
    {
        "id": 7,
        "text": "I prefer a work style where I spend most of my time with reports or imaging rather than directly with patients.",
        "dimension": "patient_interaction",
        "reverse": True,
    },
    {
        "id": 8,
        "text": "Counseling patients through emotional or difficult situations comes naturally to me.",
        "dimension": "patient_interaction",
        "reverse": False,
    },

    # ── Work-life balance (4) ────────────────────────────────────────────────
    {
        "id": 9,
        "text": "Having predictable working hours is very important to my quality of life.",
        "dimension": "work_life_balance",
        "reverse": False,
    },
    {
        "id": 10,
        "text": "I'm comfortable regularly sacrificing personal or family time for my career.",
        "dimension": "work_life_balance",
        "reverse": True,
    },
    {
        "id": 11,
        "text": "A specialty that gives me time for hobbies, travel, or family matters a great deal to me.",
        "dimension": "work_life_balance",
        "reverse": False,
    },
    {
        "id": 12,
        "text": "I'd be okay being on call most weekends and nights if the specialty suited me otherwise.",
        "dimension": "work_life_balance",
        "reverse": True,
    },

    # ── Stress tolerance (3) ────────────────────────────────────────────────
    {
        "id": 13,
        "text": "I perform at my best when the stakes are high and there's pressure to decide quickly.",
        "dimension": "stress_tolerance",
        "reverse": False,
    },
    {
        "id": 14,
        "text": "I stay calm and focused when managing multiple critical or deteriorating patients simultaneously.",
        "dimension": "stress_tolerance",
        "reverse": False,
    },
    {
        "id": 15,
        "text": "Uncertainty and unpredictability in my day-to-day work is something I handle well.",
        "dimension": "stress_tolerance",
        "reverse": False,
    },

    # ── Manual dexterity (3) ────────────────────────────────────────────────
    {
        "id": 16,
        "text": "I enjoy tasks that require precise hand-eye coordination and fine motor control.",
        "dimension": "manual_dexterity",
        "reverse": False,
    },
    {
        "id": 17,
        "text": "I'm confident in my ability to perform delicate, detailed physical work accurately.",
        "dimension": "manual_dexterity",
        "reverse": False,
    },
    {
        "id": 18,
        "text": "Working with my hands to achieve a precise outcome gives me a sense of deep satisfaction.",
        "dimension": "manual_dexterity",
        "reverse": False,
    },

    # ── Academic / research (4) ──────────────────────────────────────────────
    {
        "id": 19,
        "text": "I genuinely enjoy reading research papers and staying updated with the latest clinical literature.",
        "dimension": "academic",
        "reverse": False,
    },
    {
        "id": 20,
        "text": "I see myself teaching, mentoring, or training junior doctors as part of my career.",
        "dimension": "academic",
        "reverse": False,
    },
    {
        "id": 21,
        "text": "Understanding the underlying mechanism of a disease deeply interests me beyond just treating it.",
        "dimension": "academic",
        "reverse": False,
    },
    {
        "id": 22,
        "text": "I'd enjoy working in an academic medical institution more than a purely clinical private setup.",
        "dimension": "academic",
        "reverse": False,
    },

    # ── Emergency readiness (3) ──────────────────────────────────────────────
    {
        "id": 23,
        "text": "I thrive in emergency situations where I need to make quick, high-stakes decisions.",
        "dimension": "emergency",
        "reverse": False,
    },
    {
        "id": 24,
        "text": "Fast-paced, adrenaline-fueled work environments motivate me more than calm, routine ones.",
        "dimension": "emergency",
        "reverse": False,
    },
    {
        "id": 25,
        "text": "I'm fully comfortable making life-or-death decisions under time pressure.",
        "dimension": "emergency",
        "reverse": False,
    },

    # ── Tech affinity (3) ────────────────────────────────────────────────────
    {
        "id": 26,
        "text": "I find working with advanced medical equipment, imaging, or diagnostic technology fascinating.",
        "dimension": "tech_affinity",
        "reverse": False,
    },
    {
        "id": 27,
        "text": "A role where technology and precision instruments are central to daily work appeals to me.",
        "dimension": "tech_affinity",
        "reverse": False,
    },
    {
        "id": 28,
        "text": "I enjoy understanding how medical devices or imaging systems work at a technical level.",
        "dimension": "tech_affinity",
        "reverse": False,
    },

    # ── Income priority (4) ──────────────────────────────────────────────────
    {
        "id": 29,
        "text": "High earning potential is one of the most important factors in my specialty choice.",
        "dimension": "income",
        "reverse": False,
    },
    {
        "id": 30,
        "text": "Financial security for myself and my family is a top priority in my career decisions.",
        "dimension": "income",
        "reverse": False,
    },
    {
        "id": 31,
        "text": "I would choose a lower-paying specialty if it aligned with my passion and values.",
        "dimension": "income",
        "reverse": True,
    },
    {
        "id": 32,
        "text": "Private practice income potential is a significant consideration for me.",
        "dimension": "income",
        "reverse": False,
    },

    # ── Physical stamina (3) ─────────────────────────────────────────────────
    {
        "id": 33,
        "text": "I can stand and remain focused for 6–8 hours of continuous work without difficulty.",
        "dimension": "stamina",
        "reverse": False,
    },
    {
        "id": 34,
        "text": "Long surgical procedures or physically demanding shifts don't intimidate me.",
        "dimension": "stamina",
        "reverse": False,
    },
    {
        "id": 35,
        "text": "Physical exhaustion after an intense shift doesn't demotivate me from coming back the next day.",
        "dimension": "stamina",
        "reverse": False,
    },
]
