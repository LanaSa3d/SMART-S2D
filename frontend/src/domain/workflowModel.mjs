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
    prompt: "The software shall [action] [target/object].",
    verbs: ["verify", "process", "calculate", "validate", "generate"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      goalStatement: "verify",
      subjectName: "user credentials",
      subjectStatement: "to allow authorized access to the requirements workspace",
      subjectModel: "role-based access control model",
    },
  },
  "Data requirements": {
    accent: "green",
    shortName: "Data",
    intent: "Describe stored, managed, retrieved, or preserved software data.",
    prompt: "The software shall store/manage/retrieve [data entity].",
    verbs: ["store", "manage", "retrieve", "record", "archive"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      goalStatement: "store",
      subjectName: "requirement metadata",
      subjectStatement: "including category, priority, status, owner, and version history",
      subjectModel: "normalized requirement repository model",
    },
  },
  "User interface requirements": {
    accent: "gold",
    shortName: "UI",
    intent: "Define screens, forms, menus, dashboards, and navigation behavior.",
    prompt: "The software shall display/provide/render [UI component].",
    verbs: ["display", "provide", "render", "show", "navigate"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      goalStatement: "display",
      subjectName: "software taxonomy workspace",
      subjectStatement: "to help analysts browse categories and write requirements",
      subjectModel: "guided taxonomy navigation model",
    },
  },
  "Technical interface requirements": {
    accent: "violet",
    shortName: "Interface",
    intent: "Specify APIs, integrations, protocols, and external system communication.",
    prompt: "The software shall integrate/connect/communicate with [external system/API].",
    verbs: ["integrate", "connect", "communicate", "exchange", "authenticate"],
    defaults: {
      softwareName: "SMART-S2D",
      obligation: "shall",
      goalStatement: "integrate",
      subjectName: "Supabase Auth",
      subjectStatement: "to authenticate users through secure tokens",
      subjectModel: "OAuth-based Supabase authentication model",
    },
  },
};

export function getDefaultTemplateValues(categoryName) {
  return { ...SOFTWARE_CATEGORY_TEMPLATES[categoryName].defaults };
}

export function buildTemplateStatement(categoryName, values) {
  const template = SOFTWARE_CATEGORY_TEMPLATES[categoryName];
  const nextValues = { ...template.defaults, ...values };

  return `The "${nextValues.softwareName}" software ${nextValues.obligation} ${nextValues.goalStatement} "${nextValues.subjectName}" described as follows: "${nextValues.subjectStatement}" according to the model: "${nextValues.subjectModel}".`;
}
