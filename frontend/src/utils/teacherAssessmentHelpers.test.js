import { describe, expect, it } from 'vitest';
import {
  pickDefaultGrade,
  sortGrades,
} from './teacherAssessmentHelpers';

describe('teacherAssessmentHelpers', () => {
  describe('sortGrades', () => {
    it('sorts grades numerically', () => {
      expect(sortGrades(['Grade 3', 'Grade 1', 'Grade 2'])).toEqual([
        'Grade 1',
        'Grade 2',
        'Grade 3',
      ]);
    });
  });

  describe('pickDefaultGrade', () => {
    it('prefers Grade 1 when available', () => {
      expect(pickDefaultGrade(['Grade 3', 'Grade 1', 'Grade 2'])).toBe('Grade 1');
    });

    it('prefers Grade 2 when Grade 1 is missing', () => {
      expect(pickDefaultGrade(['Grade 5', 'Grade 2', 'Grade 3'])).toBe('Grade 2');
    });

    it('falls back to first sorted grade when neither 1 nor 2 exists', () => {
      expect(pickDefaultGrade(['Grade 5', 'Grade 4'])).toBe('Grade 4');
    });

    it('returns empty string when no grades exist', () => {
      expect(pickDefaultGrade([])).toBe('');
    });
  });
});
