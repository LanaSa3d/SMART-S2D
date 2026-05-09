export function parsePastedRequirements(text) {
  return buildCandidateResult(splitRequirementText(text), "Paste", "Pasted text");
}

export function parseTxtRequirements(text, sourceName = "requirements.txt") {
  return buildCandidateResult(splitRequirementText(text), "TXT", sourceName);
}

export function parseCsvRequirements(csvText, sourceName = "requirements.csv") {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { candidates: [], warnings: ["CSV import did not contain requirement rows."] };
  }

  const headers = rows[0].map((header) => normalizeHeader(header));
  const titleIndex = headers.indexOf("title");
  const statementIndex = headers.findIndex((header) =>
    ["statement", "requirement", "description", "formal_statement"].includes(header),
  );

  if (statementIndex === -1) {
    return {
      candidates: [],
      warnings: ["CSV import requires a statement, requirement, or description column."],
    };
  }

  const statements = rows.slice(1).map((row) => {
    const rawText = row[statementIndex]?.trim() ?? "";
    const title = titleIndex >= 0 ? row[titleIndex]?.trim() : "";
    return { rawText, title };
  });

  return {
    candidates: statements
      .filter((item) => item.rawText)
      .map((item, index) => createCandidate(item.rawText, "CSV", sourceName, index, item.title)),
    warnings: [],
  };
}

export function parseDocxRequirements() {
  return {
    candidates: [],
    warnings: ["DOCX import review is planned for the next parser slice."],
  };
}

function buildCandidateResult(statements, sourceType, sourceName) {
  return {
    candidates: statements.map((statement, index) =>
      createCandidate(statement, sourceType, sourceName, index),
    ),
    warnings: [],
  };
}

function createCandidate(rawText, sourceType, sourceName, index, title = "") {
  return {
    tempId: `CAND-${String(index + 1).padStart(3, "0")}`,
    title: title || deriveTitle(rawText),
    rawText,
    sourceType,
    sourceName,
  };
}

function splitRequirementText(text) {
  return String(text ?? "")
    .split(/\r?\n|(?<=\.)\s+(?=The\s+software\s+(?:shall|should|must)\s+)/i)
    .map((line) => line.replace(/^\s*(?:\d+[\).\s-]+|[-*]\s+)/, "").trim())
    .filter(Boolean);
}

function deriveTitle(rawText) {
  const cleaned = rawText
    .replace(/^the\s+software\s+(shall|should|must)\s+/i, "")
    .replace(/\.$/, "")
    .trim();
  return cleaned ? sentenceCase(cleaned.split(/\s+/).slice(0, 5).join(" ")) : "Imported requirement";
}

function sentenceCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function parseCsvRows(csvText) {
  return String(csvText ?? "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

function normalizeHeader(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
