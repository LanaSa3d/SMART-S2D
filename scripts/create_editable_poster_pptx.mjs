import fs from "node:fs";
import path from "node:path";

const out = path.resolve("tmp_smart_poster_pptx");
const mediaDir = path.join(out, "ppt", "media");
const slidesDir = path.join(out, "ppt", "slides");
const relsDir = path.join(out, "ppt", "slides", "_rels");
const logoSource = path.resolve("tmp_poster_assets/smart_logo.png");

fs.rmSync(out, { recursive: true, force: true });
for (const dir of [
  out,
  path.join(out, "_rels"),
  path.join(out, "docProps"),
  path.join(out, "ppt"),
  path.join(out, "ppt", "_rels"),
  path.join(out, "ppt", "theme"),
  path.join(out, "ppt", "slideMasters"),
  path.join(out, "ppt", "slideMasters", "_rels"),
  path.join(out, "ppt", "slideLayouts"),
  path.join(out, "ppt", "slideLayouts", "_rels"),
  slidesDir,
  relsDir,
  mediaDir,
]) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.copyFileSync(logoSource, path.join(mediaDir, "smart_logo.png"));

const EMU = 914400;
const W = 25.2;
const H = 36.0;
const cx = Math.round(W * EMU);
const cy = Math.round(H * EMU);

const C = {
  bg: "00101E",
  panel: "031B2A",
  panel2: "061F31",
  green: "8CF000",
  green2: "47E887",
  cyan: "00A7A7",
  white: "F8FAFC",
  muted: "B7C9D4",
  orange: "FF5A1F",
  red: "FF3B1F",
  line: "0B6B73",
  dark: "07131D",
};

let id = 2;
const shapes = [];

const e = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const emu = (n) => Math.round(n * EMU);

function p(text, opts = {}) {
  const {
    size = 14,
    color = C.white,
    bold = false,
    align = "l",
    font = "Aptos",
    bullet = false,
  } = opts;
  return `<a:p><a:pPr algn="${align}"${bullet ? ' marL="274320" indent="-182880"' : ""}>${
    bullet ? `<a:buChar char="•"/>` : ""
  }<a:r><a:rPr lang="en-US" sz="${Math.round(size * 100)}"${
    bold ? ' b="1"' : ""
  }><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${font}"/></a:rPr><a:t>${e(
    text,
  )}</a:t></a:r><a:endParaRPr lang="en-US" sz="${Math.round(size * 100)}"/></a:p>`;
}

function textXml(lines, opts = {}) {
  const bodyPr = `<a:bodyPr wrap="square" anchor="${opts.anchor ?? "t"}"><a:spAutoFit/></a:bodyPr>`;
  const paragraphs = Array.isArray(lines)
    ? lines
    : String(lines)
        .split("\n")
        .map((line) => line.trimEnd());
  return `<p:txBody>${bodyPr}<a:lstStyle/>${paragraphs
    .map((line) => p(line, opts))
    .join("")}</p:txBody>`;
}

function rect(x, y, w, h, opts = {}) {
  const {
    fill = C.panel,
    line = C.line,
    lw = 1,
    radius = "roundRect",
    text = "",
    textOpts = {},
    noFill = false,
    noLine = false,
  } = opts;
  const shapeId = id++;
  shapes.push(`<p:sp><p:nvSpPr><p:cNvPr id="${shapeId}" name="Shape ${shapeId}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="${radius}"><a:avLst/></a:prstGeom>${
      noFill ? "<a:noFill/>" : `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>`
    }${
      noLine
        ? "<a:ln><a:noFill/></a:ln>"
        : `<a:ln w="${Math.round(lw * 12700)}"><a:solidFill><a:srgbClr val="${line}"/></a:solidFill></a:ln>`
    }</p:spPr>${text ? textXml(text, textOpts) : "<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>"}</p:sp>`);
}

function label(x, y, w, h, text, opts = {}) {
  rect(x, y, w, h, {
    fill: opts.fill ?? "000000",
    line: opts.line ?? "000000",
    noFill: opts.noFill ?? true,
    noLine: opts.noLine ?? true,
    radius: "rect",
    text,
    textOpts: {
      size: opts.size ?? 12,
      color: opts.color ?? C.white,
      bold: opts.bold ?? false,
      align: opts.align ?? "l",
      anchor: opts.anchor ?? "t",
      font: opts.font ?? "Aptos",
    },
  });
}

function image(x, y, w, h, rId) {
  const picId = id++;
  shapes.push(`<p:pic><p:nvPicPr><p:cNvPr id="${picId}" name="Picture ${picId}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
    <p:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
    <p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`);
}

function line(x1, y1, x2, y2, color = C.green, width = 1.2) {
  const lineId = id++;
  shapes.push(`<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${lineId}" name="Connector ${lineId}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>
    <p:spPr><a:xfrm><a:off x="${emu(Math.min(x1, x2))}" y="${emu(Math.min(y1, y2))}"/><a:ext cx="${emu(Math.abs(x2 - x1))}" cy="${emu(Math.abs(y2 - y1))}"/></a:xfrm>
    <a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${Math.round(width * 12700)}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:tailEnd type="triangle"/></a:ln></p:spPr></p:cxnSp>`);
}

function panel(x, y, w, h, num, title, opts = {}) {
  const lineColor = opts.line ?? C.cyan;
  rect(x, y, w, h, { fill: C.panel, line: lineColor, lw: 1.2 });
  rect(x + 0.28, y + 0.22, 0.65, 0.58, {
    fill: opts.badge ?? C.green,
    line: opts.badge ?? C.green,
    text: String(num),
    textOpts: { color: C.dark, bold: true, size: 18, align: "ctr", anchor: "mid" },
  });
  label(x + 1.1, y + 0.25, w - 1.3, 0.45, title, { bold: true, size: 13.5 });
}

function bulletList(x, y, w, h, items, opts = {}) {
  rect(x, y, w, h, { noFill: true, noLine: true, radius: "rect", text: items, textOpts: { size: opts.size ?? 9.5, color: opts.color ?? C.white, bullet: true } });
}

// Background
rect(0, 0, W, H, { fill: C.bg, line: C.bg, radius: "rect" });
for (let i = 0; i < 24; i++) {
  line(0.4 + i * 1.05, 3.9, 0.6 + i * 1.05, 3.9, i % 2 ? "193546" : "0B2C3A", 0.25);
}

// Header
label(0.35, 0.72, 5.1, 0.55, "▌▌▌▌  جامعة اليمامة", { size: 17, bold: true });
label(2.3, 1.3, 3.0, 0.35, "Al Yamamah University", { size: 10.5, bold: true });
line(0.42, 1.85, 5.2, 1.85, "FF8B38", 1.6);
line(0.42, 2.05, 5.2, 2.05, C.white, 1.0);
line(5.8, 0.35, 5.8, 2.9, "9AAAB5", 0.65);
label(7.4, 0.25, 10.4, 1.05, "SMART-S2D", { size: 42, bold: true, align: "ctr", font: "Arial" });
label(6.5, 1.55, 12.4, 0.35, "Support Software for Categorizing Endogenous Requirements", { size: 12.3, bold: true, align: "ctr" });
label(6.3, 2.05, 12.9, 0.35, "SMART: Systemic Approach to Categorizing and Modeling Requirements", { size: 10.6, color: C.white, bold: true, align: "ctr" });
label(7.4, 2.55, 10.4, 0.3, "Lana Saad   •   Maya Besmar   •   Lama Elkhawaja", { size: 10.4, align: "ctr" });
image(19.4, 0.25, 3.1, 2.55, "rId2");
line(0.35, 3.05, 24.85, 3.05, "8B8F92", 0.8);
label(10.25, 3.18, 4.6, 0.3, "♙  Supervised by:  Prof. Azzedine Chikh", { size: 9.6, color: C.green, bold: true, align: "ctr" });

// Top cards
panel(0.35, 3.85, 5.6, 5.25, 1, "ABSTRACT");
label(1.65, 4.8, 3.6, 3.4, "SMART-S2D is a web-based support system that applies the SMART methodology and R2F framework to help analysts write, categorize, retrieve, and export software requirements through a structured taxonomy.", { size: 10.5, align: "ctr", anchor: "mid" });
panel(6.15, 3.85, 5.6, 5.25, 2, "INTRODUCTION");
bulletList(7.0, 4.7, 4.4, 3.8, [
  "Requirements engineering depends on clear and consistent requirement classification.",
  "Traditional functional/non-functional classification is often too broad.",
  "SMART provides a hybrid taxonomy for structured requirement categorization.",
  "SMART-S2D transforms the methodology into a practical software prototype.",
], { size: 8.9 });
panel(11.95, 3.85, 5.6, 5.25, 3, "PROBLEM STATEMENT", { line: C.red, badge: C.orange });
bulletList(12.8, 4.65, 4.3, 3.9, [
  "No dedicated tool operationalizes SMART/R2F categorization.",
  "Manual classification causes inconsistency between analysts.",
  "Flat tools make taxonomy navigation and retrieval difficult.",
  "Requirement refinement and reporting need structured support.",
], { size: 8.8 });
panel(17.75, 3.85, 7.1, 5.25, 4, "PROPOSED SOLUTION");
bulletList(18.65, 4.55, 5.8, 4.0, [
  "Hybrid taxonomy (Function, Data, UI, Technical Interface)",
  "Guided SMART Requirement Template",
  "Software taxonomy navigation",
  "Requirement repository and search",
  "Dashboard analytics",
  "Traceability, reporting & export",
], { size: 9.2 });

// Methodology
panel(0.35, 9.35, 24.5, 7.7, 5, "METHODOLOGY (SMART APPROACH)");
const steps = [
  ["Collect requirements", "Gather raw requirements\nfrom various sources.", "⌄"],
  ["Select Software taxonomy", "Choose Function, Data,\nUI, Technical Interface.", "▦"],
  ["Fill SMART/R2F template", "Complete the guided template\nfollowing SMART/R2F rules.", "✎"],
  ["Review suggestion & validation", "System suggests categories;\nanalysts validate and refine.", "✓"],
  ["Save to repository", "Store the validated requirement\nin the structured repository.", "DB"],
  ["Search, report, and export", "Retrieve, analyze, and export\nrequirements for reports.", "⌕"],
];
const sx = 1.25;
const gap = 3.78;
for (let i = 0; i < steps.length; i++) {
  const x = sx + i * gap;
  rect(x, 10.25, 1.9, 1.1, { fill: C.panel2, line: C.green, text: steps[i][2], textOpts: { size: steps[i][2] === "DB" ? 16 : 22, color: C.green, bold: true, align: "ctr", anchor: "mid" } });
  if (i < steps.length - 1) line(x + 2.0, 10.82, x + gap - 0.12, 10.82, C.green, 1.6);
  label(x - 0.25, 11.55, 2.55, 0.45, `${i + 1}. ${steps[i][0]}`, { size: 8.5, bold: true, align: "ctr" });
  label(x - 0.4, 12.05, 2.9, 0.75, steps[i][1], { size: 7.4, color: C.white, align: "ctr" });
}
rect(0.65, 13.2, 24.0, 3.55, { fill: "021827", line: C.green });
label(1.0, 13.35, 9.2, 0.35, "ACTIVE SOFTWARE SUBJECTS (ENDOGENOUS REQUIREMENTS)", { size: 9.5, color: C.green, bold: true });
const cards = [
  ["⚙", "Function\nrequirements", "Capture behavior the\nsoftware performs for\nusers or stakeholders."],
  ["DB", "Data\nrequirements", "Describe stored,\nmanaged, retrieved, or\npreserved software data."],
  ["▭", "User Interface\nrequirements", "Define screens, forms,\nmenus, dashboards, and\nnavigation behavior."],
  ["⌁", "Technical Interface\nrequirements", "Specify APIs, integrations,\nprotocols, and external\nsystem communication."],
];
for (let i = 0; i < cards.length; i++) {
  const x = 0.95 + i * 4.7;
  rect(x, 14.0, 4.15, 2.25, { fill: C.panel, line: C.green });
  label(x + 0.25, 14.25, 0.7, 0.45, cards[i][0], { size: cards[i][0] === "DB" ? 12 : 18, color: C.green, bold: true, align: "ctr" });
  label(x + 1.0, 14.18, 2.7, 0.55, cards[i][1], { size: 9.3, bold: true });
  label(x + 0.28, 14.95, 3.55, 1.0, cards[i][2], { size: 7.7, color: C.white });
}
label(20.0, 13.55, 2.6, 0.35, "FUTURE SCOPE", { size: 9.0, bold: true, align: "ctr" });
rect(19.4, 14.0, 4.6, 0.85, { fill: "1A2733", line: "7A8790", text: "Operation requirements", textOpts: { size: 8.7, color: "B4BCC3", align: "ctr", anchor: "mid" } });
rect(19.4, 15.15, 4.6, 0.85, { fill: "1A2733", line: "7A8790", text: "Development requirements", textOpts: { size: 8.7, color: "B4BCC3", align: "ctr", anchor: "mid" } });

// System design and database diagrams
panel(0.35, 17.25, 15.4, 7.75, 6, "SYSTEM DESIGN (LAYERED ARCHITECTURE)");
const layers = [
  ["1. USER LAYER", "Analyst     Project Manager     Admin     Software User"],
  ["2. PRESENTATION LAYER", "Workspace | Dashboard | Template | Repository | Search | Reports"],
  ["3. APPLICATION LAYER", "Auth & Authorization | SMART Rule Engine | Requirement Management | Reporting"],
  ["4. DATA LAYER", "Supabase Auth | Supabase PostgreSQL | Companies | Projects | Requirements | Taxonomy"],
  ["5. INTEGRATION LAYER", "XML/DOCX Export | Authentication Services | Future API Integrations"],
  ["6. INFRASTRUCTURE & SECURITY", "Static Web Server | Cloud Hosting | RBAC | RLS | Audit Logging"],
];
for (let i = 0; i < layers.length; i++) {
  const y = 18.25 + i * 1.0;
  rect(0.85, y, 14.25, 0.78, { fill: i % 2 ? "F4F7FA" : "FFFFFF", line: "0C365B", radius: "roundRect" });
  label(1.05, y + 0.12, 4.0, 0.22, layers[i][0], { size: 7.9, color: "118354", bold: true });
  label(5.15, y + 0.18, 9.6, 0.28, layers[i][1], { size: 6.6, color: "071B33", bold: true, align: "ctr" });
  if (i < layers.length - 1) line(7.98, y + 0.8, 7.98, y + 0.98, "09264A", 1.0);
}

panel(15.95, 17.25, 8.9, 7.75, "", "DATABASE / MODEL (OVERVIEW)");
function tableBox(x, y, w, h, title, fields) {
  rect(x, y, w, h, { fill: "F8FAFC", line: "8DA9BA", radius: "roundRect" });
  rect(x, y, w, 0.42, { fill: "9BC6DA", line: "8DA9BA", radius: "rect", text: title, textOpts: { size: 6.6, color: "081D2F", bold: true, align: "ctr", anchor: "mid" } });
  label(x + 0.08, y + 0.5, w - 0.15, h - 0.55, fields.join("\n"), { size: 5.25, color: "071B33" });
}
tableBox(16.35, 18.1, 2.45, 1.5, "Generic Subject", ["genericId INT", "genericName", "description"]);
tableBox(16.35, 20.1, 2.65, 1.8, "Specific Subject", ["specificId INT", "specificName", "statement", "genericId FK"]);
tableBox(19.55, 18.4, 2.7, 3.1, "Requirement", ["requirementId INT", "description", "priority", "status", "dateLevel", "nature", "mode", "createDate", "specificId FK", "softwareId FK"]);
tableBox(22.45, 18.1, 2.05, 1.75, "Software", ["softwareId INT", "softwareName", "version", "description", "systemId FK"]);
tableBox(22.45, 20.55, 1.85, 1.0, "System", ["systemId INT", "systemName"]);
tableBox(22.25, 22.25, 2.25, 1.65, "Project", ["projectId INT", "projectName", "createdAt", "softwareId FK", "companyId FK"]);
tableBox(16.7, 22.5, 2.2, 1.05, "Company", ["companyId INT", "companyName"]);
line(17.65, 20.1, 17.65, 19.6, "071B33", 0.8);
line(19.0, 20.95, 19.55, 19.95, "071B33", 0.8);
line(22.25, 19.95, 22.45, 19.0, "071B33", 0.8);
line(23.4, 19.85, 23.4, 20.55, "071B33", 0.8);
line(23.4, 19.85, 23.4, 22.25, "071B33", 0.8);
line(18.9, 23.0, 22.25, 23.0, "071B33", 0.8);
rect(16.35, 24.05, 8.1, 0.55, { fill: "071827", line: C.green, text: "Detailed ER-style database model for SMART-S2D requirement traceability", textOpts: { size: 7.0, align: "ctr", anchor: "mid" } });

// UI prototype
panel(0.35, 25.2, 24.5, 3.45, 7, "UI PROTOTYPE (DARK THEME)");
const ui = [
  ["Workspace and Company\nManagement", "Companies\nProjects\nOpen / Update"],
  ["Requirement Distribution\nDashboard", "Total  Draft  Review\nApproved Rejected"],
  ["SMART Requirement\nTemplate", "Software name\nGeneric subject\nSpecific subject"],
  ["Search and Requirements\nRepository", "Keyword  Status\nCode  Subject  Category"],
];
for (let i = 0; i < ui.length; i++) {
  const x = 0.75 + i * 6.0;
  rect(x, 26.0, 5.25, 1.55, { fill: "021827", line: "4B6772" });
  label(x + 0.25, 26.18, 4.8, 0.75, ui[i][1], { size: 6.4, color: C.green });
  rect(x + 0.25, 27.0, 4.7, 0.28, { fill: C.green2, line: C.green2 });
  label(x + 0.15, 27.72, 4.95, 0.55, `${i + 1}  ${ui[i][0]}`, { size: 7.9, bold: true, align: "ctr" });
}

// Implementation details
panel(0.35, 28.95, 24.5, 3.15, 8, "IMPLEMENTATION DETAILS");
const impl = [
  ["FRONTEND", ["Browser ES modules", "Modular UI rendering", "Responsive CSS"]],
  ["DEV SERVER", ["Node.js static server", "Zero dependencies"]],
  ["BACKEND", ["Python Django scaffold", "Django REST Framework"]],
  ["AUTH & DATABASE", ["Supabase Auth", "Supabase PostgreSQL"]],
  ["SECURITY", ["RBAC roles", "RLS policies", "Audit logging"]],
  ["REPORTS & EXPORT", ["XML export", "DOCX export", "Dashboard analytics"]],
  ["DEPLOYMENT", ["Vercel-ready frontend", "Lightweight backend"]],
];
for (let i = 0; i < impl.length; i++) {
  const x = 0.7 + i * 3.45;
  rect(x, 29.75, 3.05, 1.95, { fill: C.panel, line: C.green });
  label(x + 0.25, 29.95, 2.6, 0.3, impl[i][0], { size: 7.2, color: C.green, bold: true, align: "ctr" });
  bulletList(x + 0.25, 30.35, 2.5, 1.0, impl[i][1], { size: 6.4 });
}

// Conclusion
rect(0.35, 32.55, 24.5, 2.25, { fill: C.panel, line: C.cyan });
rect(0.75, 32.95, 0.65, 0.58, { fill: C.green, line: C.green, text: "9", textOpts: { color: C.dark, bold: true, size: 18, align: "ctr", anchor: "mid" } });
label(1.65, 32.98, 3.0, 0.35, "CONCLUSION", { size: 13, bold: true });
label(4.2, 32.95, 14.0, 0.95, "SMART-S2D bridges the gap between the theoretical strength of SMART and the lack of dedicated tool support by providing a structured, guided, and demonstration-ready prototype for software requirement categorization and management.", { size: 8.7 });

const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/><a:chOff x="0" y="0"/><a:chExt cx="${cx}" cy="${cy}"/></a:xfrm></p:grpSpPr>${shapes.join("\n")}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

fs.writeFileSync(path.join(slidesDir, "slide1.xml"), slideXml);
fs.writeFileSync(
  path.join(relsDir, "slide1.xml.rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/smart_logo.png"/></Relationships>`,
);
fs.writeFileSync(
  path.join(out, "[Content_Types].xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
);
fs.writeFileSync(
  path.join(out, "_rels", ".rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
);
fs.writeFileSync(
  path.join(out, "ppt", "presentation.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst><p:sldSz cx="${cx}" cy="${cy}" type="custom"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle/></p:presentation>`,
);
fs.writeFileSync(
  path.join(out, "ppt", "_rels", "presentation.xml.rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>`,
);
fs.writeFileSync(
  path.join(out, "ppt", "slideMasters", "slideMaster1.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/><a:chOff x="0" y="0"/><a:chExt cx="${cx}" cy="${cy}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`,
);
fs.writeFileSync(
  path.join(out, "ppt", "slideMasters", "_rels", "slideMaster1.xml.rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`,
);
fs.writeFileSync(
  path.join(out, "ppt", "slideLayouts", "slideLayout1.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/><a:chOff x="0" y="0"/><a:chExt cx="${cx}" cy="${cy}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`,
);
fs.writeFileSync(
  path.join(out, "ppt", "slideLayouts", "_rels", "slideLayout1.xml.rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`,
);
fs.writeFileSync(
  path.join(out, "ppt", "theme", "theme1.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SMART-S2D"><a:themeElements><a:clrScheme name="SMART"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2><a:accent1><a:srgbClr val="${C.green}"/></a:accent1><a:accent2><a:srgbClr val="${C.cyan}"/></a:accent2><a:accent3><a:srgbClr val="${C.orange}"/></a:accent3><a:accent4><a:srgbClr val="47E887"/></a:accent4><a:accent5><a:srgbClr val="0EA5E9"/></a:accent5><a:accent6><a:srgbClr val="94A3B8"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`,
);
fs.writeFileSync(
  path.join(out, "docProps", "core.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>SMART-S2D Editable Poster</dc:title><dc:creator>OpenAI Codex</dc:creator><cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-05-14T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-14T00:00:00Z</dcterms:modified></cp:coreProperties>`,
);
fs.writeFileSync(
  path.join(out, "docProps", "app.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft PowerPoint</Application><PresentationFormat>Custom</PresentationFormat><Slides>1</Slides><Notes>0</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Theme</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>SMART-S2D</vt:lpstr></vt:vector></TitlesOfParts></Properties>`,
);

console.log(out);
