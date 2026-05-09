export const REQUIREMENT_TAXONOMIES = [
  {
    id: "software",
    name: "Software requirements",
    enabled: true,
    description: "Active SMART-S2D workflow for software subjects.",
  },
  {
    id: "operation",
    name: "Operation requirements",
    enabled: false,
    description: "Reserved for future operation-support requirements.",
  },
  {
    id: "development",
    name: "Development requirements",
    enabled: false,
    description: "Reserved for future development-support requirements.",
  },
];

export const SOFTWARE_CATEGORY_TEMPLATES = {
  "Functional requirements": {
    accent: "blue",
    shortName: "Function",
    intent: "Capture behavior the software performs for users or stakeholders.",
    prompt: "The software shall ensure Function [specific software subject].",
    verbs: ["ensure", "require", "adopt"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      relationVerb: "ensure",
      genericSubject: "Function",
      specificSubjectName: "user authentication",
      specificSubjectStatement: "verify user credentials against authorized records",
      specificSubjectModel: "role-based access control model",
      priority: "Medium",
      status: "Draft",
      sourceType: "Manual",
      notes: "",
    },
  },
  "Data requirements": {
    accent: "green",
    shortName: "Data",
    intent: "Describe stored, managed, retrieved, or preserved software data.",
    prompt: "The software shall ensure Data [specific data subject].",
    verbs: ["ensure", "require", "adopt"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      relationVerb: "ensure",
      genericSubject: "Data",
      specificSubjectName: "requirement metadata",
      specificSubjectStatement: "store category, priority, status, owner, and version history",
      specificSubjectModel: "normalized requirement repository model",
      priority: "Medium",
      status: "Draft",
      sourceType: "Manual",
      notes: "",
    },
  },
  "User interface requirements": {
    accent: "gold",
    shortName: "UI",
    intent: "Define screens, forms, menus, dashboards, and navigation behavior.",
    prompt: "The software shall ensure User Interface [specific interaction subject].",
    verbs: ["ensure", "require", "adopt"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      relationVerb: "ensure",
      genericSubject: "User Interface",
      specificSubjectName: "software taxonomy workspace",
      specificSubjectStatement: "display categories and related requirements for analyst review",
      specificSubjectModel: "guided taxonomy navigation model",
      priority: "Medium",
      status: "Draft",
      sourceType: "Manual",
      notes: "",
    },
  },
  "Technical interface requirements": {
    accent: "violet",
    shortName: "Interface",
    intent: "Specify APIs, integrations, protocols, and external system communication.",
    prompt: "The software shall ensure Technical Interface [specific integration subject].",
    verbs: ["ensure", "require", "adopt"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      relationVerb: "ensure",
      genericSubject: "Technical Interface",
      specificSubjectName: "Supabase Auth",
      specificSubjectStatement: "authenticate users through secure tokens",
      specificSubjectModel: "OAuth-based Supabase authentication model",
      priority: "Medium",
      status: "Draft",
      sourceType: "Manual",
      notes: "",
    },
  },
};

export function getDefaultTemplateValues(categoryName) {
  return { ...SOFTWARE_CATEGORY_TEMPLATES[categoryName].defaults };
}

export function buildTemplateStatement(categoryName, values) {
  const template = SOFTWARE_CATEGORY_TEMPLATES[categoryName];
  const nextValues = normalizeTemplateValues({ ...template.defaults, ...values });

  return `The "${nextValues.softwareName}" software ${nextValues.obligation} ${nextValues.relationVerb} "${nextValues.genericSubject}" "${nextValues.specificSubjectName}" described as follows: "${nextValues.specificSubjectStatement}" according to the model: "${nextValues.specificSubjectModel}".`;
}

export function buildHumanSummary(values) {
  const nextValues = normalizeTemplateValues(values);
  return `${nextValues.genericSubject}: ${nextValues.specificSubjectName} - ${nextValues.specificSubjectStatement}`;
}

function normalizeTemplateValues(values) {
  return {
    ...values,
    relationVerb: values.relationVerb ?? values.goalStatement ?? "ensure",
    genericSubject: values.genericSubject ?? "Function",
    specificSubjectName: values.specificSubjectName ?? values.subjectName ?? "",
    specificSubjectStatement: values.specificSubjectStatement ?? values.subjectStatement ?? "",
    specificSubjectModel: values.specificSubjectModel ?? values.subjectModel ?? "",
  };
}
