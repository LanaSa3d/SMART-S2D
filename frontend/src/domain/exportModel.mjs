export function buildRequirementsXml({ organization, project, requirements }) {
  const rows = requirements
    .map(
      (requirement) => `    <requirement>
      <code>${escapeXml(requirement.requirement_code)}</code>
      <title>${escapeXml(requirement.title)}</title>
      <formalStatement>${escapeXml(requirement.formal_statement)}</formalStatement>
      <subject>${escapeXml(requirement.final_subject)}</subject>
      <category>${escapeXml(requirement.final_category)}</category>
      <priority>${escapeXml(requirement.priority)}</priority>
      <status>${escapeXml(requirement.status)}</status>
      <validationState>${escapeXml(requirement.validation_state)}</validationState>
    </requirement>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<smartS2DReport generatedAt="${escapeXml(new Date().toISOString())}">
  <organization>${escapeXml(organization?.name)}</organization>
  <project>${escapeXml(project?.name)}</project>
  <requirements>
${rows}
  </requirements>
</smartS2DReport>`;
}

export function buildReportHtml({ organization, project, requirements, format = "HTML" }) {
  const rows = requirements
    .map(
      (requirement) => `<tr>
        <td>${escapeHtml(requirement.requirement_code)}</td>
        <td>${escapeHtml(requirement.title)}</td>
        <td>${escapeHtml(requirement.final_subject)}</td>
        <td>${escapeHtml(requirement.final_category)}</td>
        <td>${escapeHtml(requirement.priority)}</td>
        <td>${escapeHtml(requirement.status)}</td>
        <td>${escapeHtml(requirement.formal_statement)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html ${format === "DOCX" ? 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"' : ""}>
  <head>
    <meta charset="utf-8">
    <title>SMART-S2D Requirements Report</title>
    <style>
      body { font-family: Arial, sans-serif; color: #12252b; margin: 32px; }
      h1 { color: #0d7047; margin-bottom: 4px; }
      .meta { color: #52656b; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #cbd8d2; padding: 8px; vertical-align: top; }
      th { background: #edf7f0; color: #0d3d2b; text-align: left; }
    </style>
  </head>
  <body>
    <h1>SMART-S2D Requirements Report</h1>
    <div class="meta">
      Organization: ${escapeHtml(organization?.name)}<br>
      Project: ${escapeHtml(project?.name)}<br>
      Generated: ${escapeHtml(new Date().toLocaleString())}
    </div>
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Title</th>
          <th>Subject</th>
          <th>Category</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Formal Statement</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;
}

export function buildDocxHtml(payload) {
  return buildReportHtml({ ...payload, format: "DOCX" });
}

export function buildPdfHtml(payload) {
  return buildReportHtml({ ...payload, format: "PDF" });
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
