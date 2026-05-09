export function buildDashboardSummary(requirements) {
  return {
    totalRequirements: requirements.length,
    categorizedRequirements: requirements.filter((requirement) => requirement.status === "Categorized")
      .length,
    uncategorizedRequirements: requirements.filter((requirement) => requirement.status !== "Categorized")
      .length,
    bySubject: countBy(requirements, "subject"),
    byProject: countBy(requirements, "project"),
    byStatus: countBy(requirements, "status"),
    byPriority: countBy(requirements, "priority"),
  };
}

export function filterRequirements(requirements, filters) {
  const keyword = normalize(filters.keyword);

  return requirements.filter((requirement) => {
    const matchesKeyword =
      !keyword ||
      [
        requirement.id,
        requirement.title,
        requirement.description,
        requirement.project,
        requirement.subject,
        requirement.category,
      ]
        .map(normalize)
        .some((value) => value.includes(keyword));

    return (
      matchesKeyword &&
      matchesExact(requirement.project, filters.project) &&
      matchesExact(requirement.subject, filters.subject) &&
      matchesExact(requirement.priority, filters.priority) &&
      matchesExact(requirement.status, filters.status)
    );
  });
}

function countBy(items, propertyName) {
  return items.reduce((counts, item) => {
    const key = item[propertyName];
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function matchesExact(value, filterValue) {
  return !filterValue || value === filterValue;
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}
