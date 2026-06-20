export const getGradeNumber = (gradeLabel) => {
  const num = parseInt(String(gradeLabel).replace(/\D+/g, ''), 10);
  return Number.isNaN(num) ? null : num;
};

export const sortGrades = (gradeKeys) =>
  [...gradeKeys].sort((a, b) => {
    const numA = getGradeNumber(a);
    const numB = getGradeNumber(b);
    if (numA != null && numB != null) return numA - numB;
    if (numA != null) return -1;
    if (numB != null) return 1;
    return a.localeCompare(b);
  });

export const pickDefaultGrade = (gradeOrder) => {
  const sorted = sortGrades(gradeOrder);
  if (sorted.length === 0) return '';

  const norm = (s) => (s ?? '').toString().trim();
  const byNumber = (n) =>
    sorted.find((g) => getGradeNumber(g) === n) ||
    sorted.find((g) => norm(g).toLowerCase() === `grade ${n}`);

  return byNumber(1) || byNumber(2) || sorted[0];
};
