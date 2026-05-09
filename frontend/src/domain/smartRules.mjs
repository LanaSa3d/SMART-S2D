export const SOFTWARE_REQUIREMENT_SUBJECTS = [
  {
    id: "functional",
    name: "Functional requirements",
    description: "Behavior the software must perform for stakeholders.",
    categories: ["Authentication and processing", "Business rules", "Workflow automation"],
  },
  {
    id: "data",
    name: "Data requirements",
    description: "Data the software must store, manage, retrieve, or preserve.",
    categories: ["Storage and retrieval", "Metadata management", "Data quality"],
  },
  {
    id: "user-interface",
    name: "User interface requirements",
    description: "Screens, controls, navigation, and visual feedback provided by the software.",
    categories: ["Presentation and navigation", "Forms and input", "Dashboards and visualization"],
  },
  {
    id: "technical-interface",
    name: "Technical interface requirements",
    description: "APIs, integrations, protocols, and external software communication.",
    categories: ["External integration", "API contracts", "Authentication protocols"],
  },
];

const CATEGORY_RULES = [
  {
    subject: "Functional requirements",
    category: "Authentication and processing",
    keywords: ["login", "authenticate", "verify", "process", "calculate", "validate"],
  },
  {
    subject: "Data requirements",
    category: "Storage and retrieval",
    keywords: ["save", "store", "database", "retrieve", "record", "metadata", "repository"],
  },
  {
    subject: "User interface requirements",
    category: "Presentation and navigation",
    keywords: ["page", "button", "form", "dashboard", "menu", "display", "render", "screen"],
  },
  {
    subject: "Technical interface requirements",
    category: "External integration",
    keywords: ["api", "rest", "json", "oauth", "external system", "integration", "integrate", "connect"],
  },
];

const ACTION_VERBS = [
  "verify",
  "store",
  "display",
  "retrieve",
  "integrate",
  "authenticate",
  "process",
  "calculate",
  "manage",
  "export",
  "filter",
  "create",
  "update",
  "delete",
  "validate",
  "connect",
];

const VAGUE_WORDS = ["better", "easy", "fast", "user-friendly", "etc"];

export function suggestSmartCategory(requirementText) {
  const normalizedText = normalize(requirementText);
  const scoredRules = CATEGORY_RULES.map((rule) => {
    const matches = rule.keywords.filter((keyword) => normalizedText.includes(keyword));
    return { ...rule, matches };
  }).sort((left, right) => right.matches.length - left.matches.length);

  const bestRule = scoredRules[0];
  if (!bestRule || bestRule.matches.length === 0) {
    return {
      subject: "Functional requirements",
      category: "Business rules",
      confidence: 0.35,
      reason: "No strong keyword match was found, so review is required.",
    };
  }

  return {
    subject: bestRule.subject,
    category: bestRule.category,
    confidence: Math.min(0.95, 0.55 + bestRule.matches.length * 0.2),
    reason: `Matched ${bestRule.matches.join(", ")} keyword(s).`,
  };
}

export function validateRequirementWriting(requirementText) {
  const normalizedText = normalize(requirementText);
  const warnings = [];

  if (!hasSmartRequirementPattern(normalizedText)) {
    warnings.push(
      'Use a required pattern: The software shall [action] [target/object], or The "[software_name]" software shall [action] "[subject]".',
    );
  }

  if (normalizedText.split(/\s+/).filter(Boolean).length < 6) {
    warnings.push("Requirement is too short to be reviewable.");
  }

  if (VAGUE_WORDS.some((word) => normalizedText.includes(word))) {
    warnings.push("Avoid vague wording such as better, easy, fast, user-friendly, or etc.");
  }

  if (!ACTION_VERBS.some((verb) => normalizedText.includes(verb))) {
    warnings.push(
      "Add a concrete action verb such as verify, store, display, retrieve, or integrate.",
    );
  }

  if (countUnrelatedActions(normalizedText) >= 3) {
    warnings.push("Split multiple unrelated actions into separate atomic requirements.");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function countUnrelatedActions(normalizedText) {
  return ACTION_VERBS.filter((verb) => normalizedText.includes(verb)).length;
}

function hasSmartRequirementPattern(normalizedText) {
  return (
    normalizedText.startsWith("the software shall ") ||
    /^the\s+".+"\s+software\s+(shall|should|must)\s+/.test(normalizedText)
  );
}
