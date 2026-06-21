export const STUDENT_SORT_KEYS = {
  NAME: 'name',
  STUDENT_AVG: 'student_average',
};

export function compareStudentsByName(a, b) {
  const aName = (a.full_name ?? '').toString().trim();
  const bName = (b.full_name ?? '').toString().trim();
  const nameCmp = aName.localeCompare(bName, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (nameCmp !== 0) return nameCmp;
  return (a.username ?? '').toString().localeCompare((b.username ?? '').toString(), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

export function hasStudentAverage(student) {
  const value = student?.student_average;
  if (value === null || value === undefined || value === '') return false;
  return Number.isFinite(Number(value));
}

export function sortStudents(students, sortKey, direction) {
  const list = [...students];

  if (sortKey === STUDENT_SORT_KEYS.STUDENT_AVG) {
    const withAverage = [];
    const withoutAverage = [];

    for (const student of list) {
      if (hasStudentAverage(student)) withAverage.push(student);
      else withoutAverage.push(student);
    }

    withAverage.sort((a, b) => {
      const cmp = Number(a.student_average) - Number(b.student_average);
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp;
      return compareStudentsByName(a, b);
    });
    withoutAverage.sort(compareStudentsByName);

    return [...withAverage, ...withoutAverage];
  }

  if (sortKey === STUDENT_SORT_KEYS.NAME) {
    list.sort((a, b) => {
      const cmp = compareStudentsByName(a, b);
      return direction === 'desc' ? -cmp : cmp;
    });
    return list;
  }

  return list;
}

export function toggleStudentSort(currentKey, currentDirection, clickedKey) {
  if (currentKey !== clickedKey) {
    return { sortKey: clickedKey, sortDirection: 'asc' };
  }
  return {
    sortKey: clickedKey,
    sortDirection: currentDirection === 'asc' ? 'desc' : 'asc',
  };
}

export function sortIndicator(columnKey, activeKey, direction) {
  if (columnKey !== activeKey) return '';
  return direction === 'asc' ? ' ↑' : ' ↓';
}

export function ariaSortValue(columnKey, activeKey, direction) {
  if (columnKey !== activeKey) return 'none';
  return direction === 'asc' ? 'ascending' : 'descending';
}
