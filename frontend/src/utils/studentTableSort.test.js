import { describe, expect, it } from 'vitest';
import {
  STUDENT_SORT_KEYS,
  compareStudentsByName,
  sortIndicator,
  sortStudents,
  toggleStudentSort,
} from './studentTableSort';

const students = [
  { id: 1, full_name: 'Charlie Brown', username: 'charlie', student_average: 90 },
  { id: 2, full_name: 'alice smith', username: 'alice', student_average: null },
  { id: 3, full_name: 'Bob Adams', username: 'bob', student_average: 55 },
  { id: 4, full_name: 'Dana Lee', username: 'dana', student_average: 80 },
];

describe('studentTableSort', () => {
  describe('compareStudentsByName', () => {
    it('sorts case-insensitively by full name', () => {
      const sorted = [...students].sort(compareStudentsByName);
      expect(sorted.map((student) => student.full_name)).toEqual([
        'alice smith',
        'Bob Adams',
        'Charlie Brown',
        'Dana Lee',
      ]);
    });
  });

  describe('sortStudents', () => {
    it('sorts by name ascending', () => {
      const sorted = sortStudents(students, STUDENT_SORT_KEYS.NAME, 'asc');
      expect(sorted.map((student) => student.full_name)).toEqual([
        'alice smith',
        'Bob Adams',
        'Charlie Brown',
        'Dana Lee',
      ]);
    });

    it('sorts by name descending', () => {
      const sorted = sortStudents(students, STUDENT_SORT_KEYS.NAME, 'desc');
      expect(sorted.map((student) => student.full_name)).toEqual([
        'Dana Lee',
        'Charlie Brown',
        'Bob Adams',
        'alice smith',
      ]);
    });

    it('sorts by student average ascending with nulls last', () => {
      const sorted = sortStudents(students, STUDENT_SORT_KEYS.STUDENT_AVG, 'asc');
      expect(sorted.map((student) => student.full_name)).toEqual([
        'Bob Adams',
        'Dana Lee',
        'Charlie Brown',
        'alice smith',
      ]);
    });

    it('sorts by student average descending with nulls last', () => {
      const sorted = sortStudents(students, STUDENT_SORT_KEYS.STUDENT_AVG, 'desc');
      expect(sorted.map((student) => student.full_name)).toEqual([
        'Charlie Brown',
        'Dana Lee',
        'Bob Adams',
        'alice smith',
      ]);
    });
  });

  describe('toggleStudentSort', () => {
    it('starts ascending when switching columns', () => {
      expect(
        toggleStudentSort(STUDENT_SORT_KEYS.NAME, 'desc', STUDENT_SORT_KEYS.STUDENT_AVG),
      ).toEqual({
        sortKey: STUDENT_SORT_KEYS.STUDENT_AVG,
        sortDirection: 'asc',
      });
    });

    it('toggles direction when clicking the same column', () => {
      expect(
        toggleStudentSort(STUDENT_SORT_KEYS.NAME, 'asc', STUDENT_SORT_KEYS.NAME),
      ).toEqual({
        sortKey: STUDENT_SORT_KEYS.NAME,
        sortDirection: 'desc',
      });
    });
  });

  describe('sortIndicator', () => {
    it('shows arrows only for the active column', () => {
      expect(sortIndicator(STUDENT_SORT_KEYS.NAME, STUDENT_SORT_KEYS.NAME, 'asc')).toBe(' ↑');
      expect(sortIndicator(STUDENT_SORT_KEYS.NAME, STUDENT_SORT_KEYS.NAME, 'desc')).toBe(' ↓');
      expect(sortIndicator(STUDENT_SORT_KEYS.STUDENT_AVG, STUDENT_SORT_KEYS.NAME, 'asc')).toBe('');
    });
  });
});
