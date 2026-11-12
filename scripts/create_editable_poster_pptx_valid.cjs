const fs = require("fs");
const path = require("path");
const Module = require("module");

const baseModules =
  "C:\\Users\\lanaa\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
process.env.NODE_PATH = [
  baseModules,
  path.join(baseModules, ".pnpm", "pptxgenjs@4.0.1", "node_modules"),
  path.join(baseModules, ".pnpm", "node_modules"),
].join(path.delimiter);
Module._initPaths();

const pptxgen = require("pptxgenjs");

const out = path.resolve("SMART-S2D-editable-poster.pptx");
const logoPath = path.resolve("tmp_poster_assets", "smart_logo.png");

if (!fs.existsSync(logoPath)) {
  throw new Error(`Missing SMART logo image: ${logoPath}`);
}

const pptx = new pptxgen();
pptx.author = "SMART-S2D";
pptx.company = "Al Yamamah University";
pptx.subject = "Editable SMART-S2D graduation poster";
pptx.title = "SMART-S2D Editable Poster";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineLayout({ name: "SMART_POSTER", width: 25.2, height: 36 });
pptx.layout = "SMART_POSTER";

const W = 25.2;
const H = 36;
const C = {
  bg: "00101E",
  panel: "031B2A",
  panel2: "061F31",
  green: "9AF000",
  green2: "55E88C",
  cyan: "17A8B5",
  white: "F8FAFC",
  muted: "B7C9D4",
  orange: "FF5A1F",
  line: "0E6372",
  dark: "061420",
  navy: "071F35",
};

const slide = pptx.addSlide();
slide.background = { color: C.bg };

function txt(text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    margin: opts.margin ?? 0.06,
    fit: opts.fit ?? "shrink",
    fontFace: opts.fontFace ?? "Aptos",
    fontSize: opts.fontSize ?? 10,
    bold: opts.bold ?? false,
    color: opts.color ?? C.white,
    align: opts.align ?? "left",
    valign: opts.valign ?? "top",
    breakLine: false,
    paraSpaceAfterPt: opts.paraSpaceAfterPt ?? 0,
    bullet: opts.bullet ?? undefined,
    rotate: opts.rotate ?? 0,
  });
}

function box(x, y, w, h, opts = {}) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: opts.radius ?? 0.08,
    fill: { color: opts.fill ?? C.panel, transparency: opts.transparency ?? 0 },
    line: { color: opts.line ?? C.line, width: opts.lineWidth ?? 1 },
  });
}

function plainBox(x, y, w, h, opts = {}) {
  slide.addShape("rect", {
    x,
    y,
    w,
    h,
    fill: { color: opts.fill ?? C.panel, transparency: opts.transparency ?? 0 },
    line: { color: opts.line ?? C.line, width: opts.lineWidth ?? 1 },
  });
}

function line(x1, y1, x2, y2, opts = {}) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  slide.addShape("line", {
    x,
    y,
    w,
    h,
    line: {
      color: opts.color ?? C.green,
      width: opts.width ?? 1.2,
      beginArrowType: opts.beginArrowType ?? "none",
      endArrowType: opts.endArrowType ?? "triangle",
      transparency: opts.transparency ?? 0,
    },
  });
}

function numberedBadge(n, x, y, color = C.green) {
  box(x, y, 0.65, 0.55, { fill: color, line: color, radius: 0.08 });
  txt(String(n), x, y + 0.03, 0.65, 0.45, {
    fontSize: 16,
    bold: true,
    color: C.bg,
    align: "center",
    valign: "mid",
  });
}

function sectionTitle(n, title, x, y, color = C.green) {
  numberedBadge(n, x, y, color);
  txt(title, x + 0.9, y + 0.06, 6, 0.4, {
    fontSize: 13,
    bold: true,
    color: C.white,
  });
}

function bullets(items, x, y, w, h, opts = {}) {
  slide.addText(items.map((item) => `- ${item}`).join("\n"), {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    fontSize: opts.fontSize ?? 9.2,
    color: opts.color ?? C.white,
    breakLine: false,
    fit: "shrink",
    margin: 0.06,
    paraSpaceAfterPt: opts.paraSpaceAfterPt ?? 5,
  });
}

function smallCaps(text, x, y, w, h, color = C.green) {
  txt(text.toUpperCase(), x, y, w, h, {
    fontSize: 8.5,
    bold: true,
    color,
    fontFace: "Aptos",
  });
}

// Header
txt("Al Yamamah University", 0.4, 0.8, 5.2, 0.5, {
  fontSize: 15,
  bold: true,
  color: C.white,
});
txt("جامعة اليمامة", 0.4, 0.35, 5.2, 0.45, {
  fontSize: 18,
  bold: true,
  color: C.white,
  align: "center",
});
plainBox(0.35, 0.92, 0.08, 0.8, { fill: "FF7A2D", line: "FF7A2D" });
plainBox(0.55, 0.68, 0.08, 1.05, { fill: "FF7A2D", line: "FF7A2D" });
plainBox(0.75, 0.48, 0.08, 1.25, { fill: "FF7A2D", line: "FF7A2D" });
line(6.4, 0.3, 6.4, 3.0, { color: "A7B1C2", width: 0.8, endArrowType: "none" });
txt("SMART-S2D", 7.1, 0.35, 11.3, 0.95, {
  fontSize: 40,
  bold: true,
  align: "center",
});
txt("Support Software for Categorizing Endogenous Requirements", 7.2, 1.35, 11.2, 0.35, {
  fontSize: 13,
  bold: true,
  align: "center",
});
txt("SMART: Systemic Approach to Categorizing and Modeling Requirements", 7.2, 1.85, 11.2, 0.35, {
  fontSize: 11,
  bold: true,
  color: C.green,
  align: "center",
});
txt("S2D: Support Software for Endogenous Requirements", 7.2, 2.25, 11.2, 0.35, {
  fontSize: 11,
  bold: true,
  color: C.green,
  align: "center",
});
txt("A Tool to support analysts in categorizing needs using the SMART approach.", 7.2, 2.62, 11.2, 0.32, {
  fontSize: 10.5,
  align: "center",
});
slide.addImage({ path: logoPath, x: 20.7, y: 0.18, w: 3.8, h: 2.8 });
line(0.35, 3.25, 24.85, 3.25, { color: "68758A", width: 0.8, endArrowType: "none" });
txt("Team Members:  Lana Saad   •   Maya Besmar   •   Lama Elkhawaja", 0.55, 3.38, 12.5, 0.35, {
  fontSize: 10,
  bold: true,
  color: C.green,
});
txt("Supervised by:  Prof. Azzedine Chikh", 18.4, 3.38, 6.2, 0.35, {
  fontSize: 10,
  bold: true,
  color: C.green,
  align: "right",
});

// Top cards
const cardY = 4.05;
const cardW = 5.75;
const cards = [
  {
    n: 1,
    title: "ABSTRACT",
    line: C.cyan,
    body: [
      "SMART-S2D is a web-based support system that applies the SMART methodology and R2F framework to help analysts write, categorize, retrieve, and export software requirements through a structured taxonomy.",
    ],
  },
  {
    n: 2,
    title: "INTRODUCTION",
    line: C.cyan,
    bullets: [
      "Requirements engineering depends on clear and consistent requirement classification.",
      "Traditional functional/non-functional classification is often too broad.",
      "SMART provides a hybrid taxonomy for structured requirement categorization.",
      "SMART-S2D transforms the methodology into a practical software prototype.",
    ],
  },
  {
    n: 3,
    title: "PROBLEM STATEMENT",
    line: C.orange,
    badge: C.orange,
    bullets: [
      "No dedicated tool operationalizes SMART/R2F categorization.",
      "Manual classification causes inconsistency between analysts.",
      "Flat tools make taxonomy navigation and retrieval difficult.",
      "Requirement refinement and reporting need structured support.",
    ],
  },
  {
    n: 4,
    title: "PROPOSED SOLUTION",
    line: C.green,
    bullets: [
      "Hybrid taxonomy (Function, Data, UI, Technical Interface)",
      "Guided SMART Requirement Template",
      "Software taxonomy navigation",
      "Requirement repository and search",
      "Dashboard analytics",
      "Traceability, reporting & export",
    ],
  },
];
cards.forEach((card, i) => {
  const x = 0.35 + i * (cardW + 0.28);
  box(x, cardY, cardW, 5.05, { fill: C.dark, line: card.line });
  sectionTitle(card.n, card.title, x + 0.28, cardY + 0.28, card.badge ?? C.green);
  if (card.body) {
    txt(card.body.join("\n"), x + 1.05, cardY + 1.08, cardW - 1.45, 3.55, {
      fontSize: 9.3,
      fit: "shrink",
    });
  } else {
    bullets(card.bullets, x + 1.15, cardY + 1.0, cardW - 1.45, 3.8, {
      fontSize: 8.5,
      paraSpaceAfterPt: 4,
    });
  }
});

// Methodology
box(0.35, 9.35, 24.5, 7.7, { fill: C.dark, line: C.cyan });
sectionTitle(5, "METHODOLOGY (SMART APPROACH)", 0.65, 9.55);
const steps = [
  ["Collect requirements", "Gather raw requirements\nfrom various sources."],
  ["Select Software taxonomy", "Choose the software\ntaxonomy: Function,\nData, UI, Technical Interface."],
  ["Fill SMART/R2F template", "Complete the guided\ntemplate following\nSMART/R2F rules."],
  ["Review suggestion &\nvalidation", "System suggests categories\nand analysts validate\nand refine."],
  ["Save to repository", "Store the validated\nrequirement in the\nstructured repository."],
  ["Search, report, and export", "Retrieve, analyze, and\nexport requirements\nfor reports."],
];
const stepStartX = 1.5;
const stepGap = 3.55;
steps.forEach(([title, desc], i) => {
  const x = stepStartX + i * stepGap;
  box(x, 10.55, 1.75, 1.25, { fill: "071728", line: C.green });
  const glyphs = ["↓", "⌘", "✎", "✓", "▣", "⌕"];
  txt(glyphs[i], x, 10.68, 1.75, 0.7, {
    fontSize: 24,
    bold: true,
    color: C.green,
    align: "center",
  });
  if (i < steps.length - 1) line(x + 1.85, 11.15, x + stepGap - 0.15, 11.15);
  txt(`${i + 1}. ${title}`, x - 0.45, 12.08, 2.7, 0.55, {
    fontSize: 8.8,
    bold: true,
    align: "center",
  });
  txt(desc, x - 0.55, 12.65, 2.9, 1.0, {
    fontSize: 7.7,
    align: "center",
    color: C.white,
  });
});
box(0.75, 14.1, 18.4, 2.55, { fill: C.dark, line: C.green });
smallCaps("Active Software Subjects (Endogenous Requirements)", 1.05, 14.28, 7.5, 0.3);
const subjects = [
  ["Function\nrequirements", "Capture behavior the software performs for users or stakeholders."],
  ["Data\nrequirements", "Describe stored, managed, retrieved, or preserved software data."],
  ["User Interface\nrequirements", "Define screens, forms, menus, dashboards, and navigation behavior."],
  ["Technical Interface\nrequirements", "Specify APIs, integrations, protocols, and external system communication."],
];
subjects.forEach(([title, desc], i) => {
  const x = 1 + i * 4.45;
  box(x, 14.75, 4.0, 1.65, { fill: "071728", line: C.green });
  txt(title, x + 0.35, 14.92, 1.95, 0.55, { fontSize: 9.3, bold: true });
  txt(desc, x + 0.35, 15.48, 3.3, 0.7, { fontSize: 7.5, color: C.white });
});
box(19.45, 14.1, 5.0, 2.55, { fill: C.dark, line: "6B7280" });
txt("FUTURE SCOPE", 19.95, 14.25, 4.0, 0.3, { fontSize: 9, bold: true, align: "center" });
box(20.0, 14.72, 3.6, 0.7, { fill: "1A2430", line: "6B7280" });
txt("Operation requirements", 20.35, 14.86, 3, 0.3, { fontSize: 8, color: C.muted });
box(20.0, 15.65, 3.6, 0.7, { fill: "1A2430", line: "6B7280" });
txt("Development requirements", 20.35, 15.79, 3, 0.3, { fontSize: 8, color: C.muted });

// System design + database model
box(0.35, 17.35, 15.4, 7.45, { fill: C.dark, line: C.cyan });
sectionTitle(6, "SYSTEM DESIGN (LAYERED ARCHITECTURE)", 0.65, 17.55);
const layerY = [18.35, 19.75, 21.65, 23.2];
const layerNames = [
  ["USER LAYER", ["Admin", "Project Manager", "Analyst", "Software User"]],
  ["INTERFACE LAYER", ["Workspace", "Dashboard", "Template", "Repository", "Search", "Reports"]],
  ["LOGIC LAYER", ["SMART Rule Engine", "Requirement Management", "Taxonomy Navigation", "Reporting", "Audit Logs"]],
  ["DATA + SECURITY", ["Supabase Auth", "Supabase PostgreSQL", "Companies", "Projects", "Requirements", "Taxonomy", "RBAC + RLS"]],
];
layerNames.forEach(([name, items], li) => {
  const y = layerY[li];
  box(0.85, y, 3.0, 0.95, { fill: C.navy, line: C.green });
  txt(name, 1.1, y + 0.28, 2.4, 0.3, { fontSize: 8, bold: true, color: C.green, align: "center" });
  const usable = 10.9;
  const itemW = usable / items.length - 0.08;
  items.forEach((item, i) => {
    const x = 4.1 + i * (usable / items.length);
    box(x, y, itemW, 0.95, { fill: "081B2B", line: "365A67" });
    txt(item, x + 0.05, y + 0.18, itemW - 0.1, 0.5, {
      fontSize: li === 3 ? 6.3 : 7,
      align: "center",
      valign: "mid",
    });
  });
});
line(8.1, 19.32, 8.1, 19.66, { color: C.green, width: 1, endArrowType: "triangle" });
line(8.1, 20.82, 8.1, 21.56, { color: C.green, width: 1, endArrowType: "triangle" });
line(8.1, 22.72, 8.1, 23.1, { color: C.green, width: 1, endArrowType: "triangle" });

box(16.0, 17.35, 8.85, 7.45, { fill: C.dark, line: C.cyan });
txt("DATABASE / MODEL (OVERVIEW)", 16.65, 17.62, 5.2, 0.4, {
  fontSize: 13,
  bold: true,
});
function dbEntity(name, fields, x, y, w = 2.5) {
  box(x, y, w, 1.1, { fill: "071728", line: "A7B1C2" });
  txt(name, x + 0.1, y + 0.1, w - 0.2, 0.3, { fontSize: 8.5, bold: true, align: "center" });
  txt(fields.join("\n"), x + 0.15, y + 0.45, w - 0.3, 0.5, { fontSize: 5.5, color: C.muted, fit: "shrink" });
}
dbEntity("Generic Subject", ["genericId", "genericName"], 16.5, 18.45, 2.65);
dbEntity("Specific Subject", ["specificId", "statement", "genericId"], 16.5, 20.0, 2.65);
dbEntity("Requirement", ["requirementId", "description", "priority", "status"], 19.45, 19.15, 2.7);
dbEntity("Software", ["softwareId", "softwareName", "version"], 22.25, 18.45, 2.2);
dbEntity("System", ["systemId", "systemName"], 20.45, 21.3, 2.1);
dbEntity("Project", ["projectId", "projectName", "createdAt"], 22.25, 21.3, 2.2);
dbEntity("Company", ["companyId", "companyName"], 17.0, 22.25, 2.3);
line(17.85, 19.55, 17.85, 20.0, { color: C.white, width: 0.7 });
line(19.15, 20.55, 19.45, 19.75, { color: C.white, width: 0.7 });
line(22.15, 19.7, 22.25, 19.05, { color: C.white, width: 0.7 });
line(23.35, 19.55, 23.35, 21.3, { color: C.white, width: 0.7 });
line(21.5, 21.0, 21.5, 21.3, { color: C.white, width: 0.7 });
line(19.3, 22.8, 22.25, 22.0, { color: C.white, width: 0.7 });
box(16.55, 23.55, 7.6, 0.75, { fill: "071728", line: C.green });
txt("RLS policies isolate company and project data between accounts.", 17.15, 23.75, 6.7, 0.25, {
  fontSize: 8,
  color: C.white,
});

// UI Prototype
box(0.35, 25.05, 24.5, 4.1, { fill: C.dark, line: C.cyan });
sectionTitle(7, "UI PROTOTYPE (DARK THEME)", 0.65, 25.25);
const mocks = [
  ["Workspace and Company\nManagement", ["Companies", "Projects", "Create company", "Join company"]],
  ["Requirement Distribution\nDashboard", ["Total 3", "Draft 1", "Approved 1", "Rejected 0"]],
  ["SMART Requirement\nTemplate", ["Software name", "Generic subject", "Specific subject", "Status"]],
  ["Search and Requirements\nRepository", ["Keyword", "Subject", "Priority", "Status"]],
];
mocks.forEach(([caption, rows], i) => {
  const x = 0.8 + i * 6.0;
  box(x, 26.05, 5.45, 2.15, { fill: "061622", line: "A7B1C2" });
  rows.forEach((row, r) => {
    box(x + 0.25, 26.25 + r * 0.38, 4.9, 0.28, { fill: r === 2 ? C.green2 : "082131", line: "27495A" });
    txt(row, x + 0.38, 26.27 + r * 0.38, 4.5, 0.16, {
      fontSize: 4.7,
      color: r === 2 ? C.bg : C.white,
      bold: r === 2,
    });
  });
  numberedBadge(i + 1, x + 0.35, 28.35, C.green);
  txt(caption, x + 1.0, 28.35, 4.1, 0.5, { fontSize: 8, align: "center" });
});

// Implementation details
box(0.35, 29.4, 24.5, 3.1, { fill: C.dark, line: C.cyan });
sectionTitle(8, "IMPLEMENTATION DETAILS", 0.65, 29.62);
const impl = [
  ["FRONTEND", ["Browser ES modules", "Modular UI rendering", "Responsive CSS"]],
  ["DEV SERVER", ["Node.js static server", "Zero dependencies"]],
  ["BACKEND", ["Python Django scaffold", "Django REST Framework"]],
  ["AUTH & DATABASE", ["Supabase Auth", "Supabase PostgreSQL"]],
  ["SECURITY", ["RBAC roles", "RLS policies", "Audit logging"]],
  ["REPORTS & EXPORT", ["XML export", "DOCX export", "Dashboard analytics"]],
  ["DEPLOYMENT", ["Vercel-ready frontend", "Lightweight backend"]],
];
impl.forEach(([title, rows], i) => {
  const x = 0.75 + i * 3.45;
  box(x, 30.45, 3.15, 1.65, { fill: "071728", line: C.green });
  txt(title, x + 0.18, 30.62, 2.8, 0.24, { fontSize: 7.1, bold: true, color: C.green });
  bullets(rows, x + 0.35, 30.92, 2.65, 0.9, { fontSize: 5.8, paraSpaceAfterPt: 1 });
});

// Conclusion
box(0.35, 32.75, 24.5, 2.55, { fill: C.dark, line: C.cyan });
numberedBadge(9, 2.7, 33.06, C.green);
txt("CONCLUSION", 3.55, 33.12, 3.2, 0.28, { fontSize: 10, bold: true });
txt(
  "SMART-S2D bridges the gap between the theoretical strength of SMART and the lack of dedicated tool support by providing a structured, guided, and demonstration-ready prototype for software requirement categorization and management.",
  6.15,
  33.08,
  15.8,
  0.7,
  { fontSize: 8.2 },
);

pptx.writeFile({ fileName: out }).then(() => {
  console.log(out);
});
