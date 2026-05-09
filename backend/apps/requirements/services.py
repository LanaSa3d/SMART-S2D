from dataclasses import dataclass


SOFTWARE_REQUIREMENT_SUBJECTS = [
    "Functional requirements",
    "Data requirements",
    "User interface requirements",
    "Technical interface requirements",
]


@dataclass(frozen=True)
class CategorySuggestion:
    subject: str
    category: str
    confidence: float
    reason: str


RULES = [
    (
        "Functional requirements",
        "Authentication and processing",
        ["login", "authenticate", "verify", "process", "calculate", "validate"],
    ),
    (
        "Data requirements",
        "Storage and retrieval",
        ["save", "store", "database", "retrieve", "record", "metadata", "repository"],
    ),
    (
        "User interface requirements",
        "Presentation and navigation",
        ["page", "button", "form", "dashboard", "menu", "display", "render", "screen"],
    ),
    (
        "Technical interface requirements",
        "External integration",
        ["api", "rest", "json", "oauth", "external system", "integration", "integrate", "connect"],
    ),
]


def suggest_smart_category(requirement_text: str) -> CategorySuggestion:
    normalized_text = requirement_text.strip().lower()
    best_subject = "Functional requirements"
    best_category = "Business rules"
    best_matches: list[str] = []

    for subject, category, keywords in RULES:
        matches = [keyword for keyword in keywords if keyword in normalized_text]
        if len(matches) > len(best_matches):
            best_subject = subject
            best_category = category
            best_matches = matches

    if not best_matches:
        return CategorySuggestion(
            subject=best_subject,
            category=best_category,
            confidence=0.35,
            reason="No strong keyword match was found, so review is required.",
        )

    return CategorySuggestion(
        subject=best_subject,
        category=best_category,
        confidence=min(0.95, 0.55 + len(best_matches) * 0.2),
        reason=f"Matched {', '.join(best_matches)} keyword(s).",
    )
