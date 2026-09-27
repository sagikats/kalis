import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Load chrome-extension/data-guard.js
function loadDataGuard() {
  const code = fs.readFileSync(path.resolve(process.cwd(), 'chrome-extension/data-guard.js'), 'utf8');
  const context: any = {
    window: {},
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.KalisDataGuard;
}

// Load chrome-extension/field-scanner.js with DOM mocks
function loadFieldScanner() {
  const code = fs.readFileSync(path.resolve(process.cwd(), 'chrome-extension/field-scanner.js'), 'utf8');
  class MockHTMLSelectElement {}
  const context: any = {
    window: { HTMLSelectElement: MockHTMLSelectElement },
    HTMLSelectElement: MockHTMLSelectElement,
    document: {
      querySelector: () => null,
      querySelectorAll: () => []
    },
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.KalisFieldScanner;
}

test('KalisDataGuard — Strict Real-Data Only & Zero-Guess Tests', async (t) => {
  const guard = loadDataGuard();
  assert.ok(guard, 'KalisDataGuard must be loaded');

  await t.test('1. Psychometric General: fills only when candidate has real psychometric score', () => {
    // Case A: Candidate took psychometric (e.g. 714)
    const withPsych = {
      hasTakenPsychometric: true,
      psychometricScore: 714
    };
    const resA = guard.evaluateField({ type: 'PSYCHOMETRIC_GENERAL' }, withPsych);
    assert.strictEqual(resA.shouldFill, true);
    assert.strictEqual(resA.value, '714');
    assert.strictEqual(resA.status, 'FILLED');

    // Case B: Candidate has NO psychometric (score = 0 or null, or hasTakenPsychometric = false)
    const noPsych = {
      hasTakenPsychometric: false,
      psychometricScore: null
    };
    const resB = guard.evaluateField({ type: 'PSYCHOMETRIC_GENERAL' }, noPsych);
    assert.strictEqual(resB.shouldFill, false);
    assert.strictEqual(resB.value, null);
    assert.strictEqual(resB.status, 'SKIPPED_NO_DATA');
  });

  await t.test('2. Quantitative Emphasis: fills only when candidate has score, never guesses or defaults to 125', () => {
    // Case A: Candidate has specific quantitative emphasis
    const candA = {
      hasTakenPsychometric: true,
      psychometricScore: 680,
      psychQuantEmphasis: 710
    };
    const resA = guard.evaluateField({ type: 'PSYCHOMETRIC_QUANT' }, candA);
    assert.strictEqual(resA.shouldFill, true);
    assert.strictEqual(resA.value, '710');

    // Case B: Candidate has NO psychometric at all
    const candB = {
      hasTakenPsychometric: false,
      psychometricScore: 0,
      psychQuant: null,
      psychQuantEmphasis: null
    };
    const resB = guard.evaluateField({ type: 'PSYCHOMETRIC_QUANT' }, candB);
    assert.strictEqual(resB.shouldFill, false);
    assert.strictEqual(resB.value, null);
    assert.strictEqual(resB.status, 'SKIPPED_NO_DATA');
  });

  await t.test('3. Specific Subject (Physics): leaves field empty if candidate did not study physics', () => {
    // Candidate has Math, English, Literature, but NO Physics
    const candWithoutPhysics = {
      subjects: [
        { name: 'מתמטיקה', units: 5, grade: 90 },
        { name: 'אנגלית', units: 5, grade: 88 },
        { name: 'ספרות', units: 2, grade: 85 }
      ]
    };

    const resGrade = guard.evaluateField(
      { type: 'SUBJECT_GRADE', subjectKey: 'physics', subjectNameHe: 'פיזיקה' },
      candWithoutPhysics
    );
    assert.strictEqual(resGrade.shouldFill, false);
    assert.strictEqual(resGrade.value, null);
    assert.strictEqual(resGrade.status, 'SKIPPED_NO_DATA');

    const resUnits = guard.evaluateField(
      { type: 'SUBJECT_UNITS', subjectKey: 'physics', subjectNameHe: 'פיזיקה' },
      candWithoutPhysics
    );
    assert.strictEqual(resUnits.shouldFill, false);
    assert.strictEqual(resUnits.value, null);
    assert.strictEqual(resUnits.status, 'SKIPPED_NO_DATA');
  });

  await t.test('4. Specific Subject (Math): fills correct units and grade when candidate has it', () => {
    const cand = {
      subjects: [
        { name: 'מתמטיקה', units: 5, grade: 95 }
      ]
    };

    const resGrade = guard.evaluateField(
      { type: 'SUBJECT_GRADE', subjectKey: 'math', subjectNameHe: 'מתמטיקה' },
      cand
    );
    assert.strictEqual(resGrade.shouldFill, true);
    assert.strictEqual(resGrade.value, '95');

    const resUnits = guard.evaluateField(
      { type: 'SUBJECT_UNITS', subjectKey: 'math', subjectNameHe: 'מתמטיקה' },
      cand
    );
    assert.strictEqual(resUnits.shouldFill, true);
    assert.strictEqual(resUnits.value, '5');
  });

  await t.test('5. Bagrut Average: fills valid average, skips if 0', () => {
    const valid = { targetBagrutAverage: 112.5 };
    const resA = guard.evaluateField({ type: 'BAGRUT_AVERAGE', precision: 1 }, valid);
    assert.strictEqual(resA.shouldFill, true);
    assert.strictEqual(resA.value, '112.5');

    const empty = { targetBagrutAverage: 0 };
    const resB = guard.evaluateField({ type: 'BAGRUT_AVERAGE' }, empty);
    assert.strictEqual(resB.shouldFill, false);
    assert.strictEqual(resB.value, null);
  });

  await t.test('6. Degree Search Input: strictly protected against score autofill', () => {
    const res = guard.evaluateField({ type: 'DEGREE_SEARCH' }, { targetBagrutAverage: 110, psychometricScore: 700 });
    assert.strictEqual(res.shouldFill, false);
    assert.strictEqual(res.value, null);
    assert.strictEqual(res.status, 'SKIPPED_PROTECTED');
  });

  await t.test('7. TAU Realit Bonus Checkbox: checks only when 5u Math AND 5u Physics are present', () => {
    // Eligible candidate
    const eligible = {
      subjects: [
        { name: 'מתמטיקה', units: 5, grade: 80 },
        { name: 'פיזיקה', units: 5, grade: 75 }
      ]
    };
    const resA = guard.evaluateField({ type: 'REALIT_BONUS_CHECKBOX' }, eligible);
    assert.strictEqual(resA.shouldFill, true);
    assert.strictEqual(resA.value, true);

    // Ineligible candidate (4u Math)
    const ineligible = {
      subjects: [
        { name: 'מתמטיקה', units: 4, grade: 90 },
        { name: 'פיזיקה', units: 5, grade: 85 }
      ]
    };
    const resB = guard.evaluateField({ type: 'REALIT_BONUS_CHECKBOX' }, ineligible);
    assert.strictEqual(resB.shouldFill, true);
    assert.strictEqual(resB.value, false);
  });

  await t.test('8. Unknown fields: skipped cleanly with SKIPPED_UNKNOWN', () => {
    const res = guard.evaluateField({ type: 'UNKNOWN' }, { psychometricScore: 700 });
    assert.strictEqual(res.shouldFill, false);
    assert.strictEqual(res.status, 'SKIPPED_UNKNOWN');
  });
});

test('KalisFieldScanner — Classification & Exclusion Tests', async (t) => {
  const scanner = loadFieldScanner();
  assert.ok(scanner, 'KalisFieldScanner must be loaded');

  await t.test('1. Degree Search input exclusion', () => {
    // HUJI style degree search bar
    const hujiSearch = {
      placeholder: 'חוג',
      className: 'search-bar',
      getAttribute: (k: string) => k === 'type' ? 'text' : '',
      closest: () => null
    };
    assert.strictEqual(scanner.isDegreeSearchInput(hujiSearch), true);

    // TAU style degree search bar
    const tauSearch = {
      placeholder: 'חיפוש תוכנית לימודים',
      className: 'filter-input',
      getAttribute: (k: string) => k === 'type' ? 'text' : '',
      closest: () => null
    };
    assert.strictEqual(scanner.isDegreeSearchInput(tauSearch), true);

    // Numeric grade input (NOT a degree search bar!)
    const gradeInput = {
      placeholder: 'ציון',
      className: 'form-control',
      getAttribute: (k: string) => k === 'type' ? 'number' : '',
      closest: () => null
    };
    assert.strictEqual(scanner.isDegreeSearchInput(gradeInput), false);
  });

  await t.test('2. Academic Field Classification', () => {
    // Bagrut average field
    const bagrutEl = {
      id: 'bagrut_avg',
      name: 'bagrut',
      placeholder: 'ממוצע בגרות',
      getAttribute: (k: string) => k === 'type' ? 'number' : '',
      closest: () => null
    };
    const resBagrut = scanner.classifyField(bagrutEl);
    assert.strictEqual(resBagrut.type, 'BAGRUT_AVERAGE');

    // Psychometric General field
    const psychEl = {
      id: 'psychometric',
      name: 'psych',
      placeholder: 'ציון פסיכומטרי כללי',
      getAttribute: (k: string) => k === 'type' ? 'number' : '',
      closest: () => null
    };
    const resPsych = scanner.classifyField(psychEl);
    assert.strictEqual(resPsych.type, 'PSYCHOMETRIC_GENERAL');

    // Math 5 units grade field
    const mathEl = {
      id: 'math_grade',
      name: 'math_score',
      placeholder: 'ציון מתמטיקה',
      getAttribute: (k: string) => k === 'type' ? 'number' : '',
      closest: () => null
    };
    const resMath = scanner.classifyField(mathEl);
    assert.strictEqual(resMath.type, 'SUBJECT_GRADE');
    assert.strictEqual(resMath.subjectKey, 'math');

    // TAU maturity field (Bagrut average)
    const tauMaturity = {
      id: 'formMaturity',
      name: 'maturity',
      placeholder: '',
      getAttribute: (k: string) => k === 'type' ? 'number' : '',
      closest: () => null
    };
    const resTau = scanner.classifyField(tauMaturity);
    assert.strictEqual(resTau.type, 'BAGRUT_AVERAGE');

    // Technion psychometry field
    const technionPsych = {
      id: 'psychometry',
      name: 'psychometry',
      placeholder: '',
      getAttribute: (k: string) => k === 'type' ? 'number' : '',
      closest: () => null
    };
    const resTechPsych = scanner.classifyField(technionPsych);
    assert.strictEqual(resTechPsych.type, 'PSYCHOMETRIC_GENERAL');

    // HUJI petAll, petMath, petVerbal fields
    const hujiPetAll = {
      id: 'petAll',
      name: 'petAll',
      placeholder: '200-800',
      getAttribute: (k: string) => k === 'type' ? 'text' : '',
      closest: () => null
    };
    assert.strictEqual(scanner.classifyField(hujiPetAll).type, 'PSYCHOMETRIC_GENERAL');

    const hujiPetMath = {
      id: 'petMath',
      name: 'petMath',
      placeholder: '200-800',
      getAttribute: (k: string) => k === 'type' ? 'text' : '',
      closest: () => null
    };
    assert.strictEqual(scanner.classifyField(hujiPetMath).type, 'PSYCHOMETRIC_QUANT');

    // Hebrew Expression (Habaa / Lashon)
    const habaaEl = {
      id: 'habaa',
      name: 'habaa',
      placeholder: '',
      getAttribute: (k: string) => k === 'type' ? 'number' : '',
      closest: () => null
    };
    const resHabaa = scanner.classifyField(habaaEl);
    assert.strictEqual(resHabaa.type, 'SUBJECT_GRADE');
    assert.strictEqual(resHabaa.subjectKey, 'hebrew_expression');
  });
});
