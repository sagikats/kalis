// Execute the product's actual pure calculators; never substitute a fitted oracle.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createJiti } = require('jiti');

// A regression run must stay offline, including accidental future dependencies.
const denied = () => { throw new Error('Admission replay prohibits network'); };
require('node:net').Socket.prototype.connect = denied;
require('node:tls').connect = denied;
require('node:dns').lookup = denied;
for (const module of ['node:http', 'node:https']) {
  require(module).request = denied;
  require(module).get = denied;
}
global.fetch = denied;

const root = path.resolve(__dirname, '..');
const jiti = createJiti(__filename, { fsCache: false, moduleCache: false });
const { calculateInstitution, SUPPORTED_INSTITUTIONS } = jiti(path.join(root, 'src/modules/calculators/index.ts'));
const supported = new Set(SUPPORTED_INSTITUTIONS.map(x => x.id));
const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'src/modules/calculators/index.ts'))).digest('hex');
const allowed = new Set(['bagrutSubjects', 'psychometricGeneral', 'psychometricQuant', 'psychometricVerbal', 'psychometricEnglish',
  'psychometricQuantEmphasis', 'psychometricVerbalEmphasis', 'mathUnits', 'mathGrade', 'physicsUnits', 'physicsGrade', 'certificateType', 'schoolSector']);
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function freeze(x) {
  if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x); }
  return x;
}
function validate(c) {
  if (!record(c) || typeof c.caseId !== 'string' || !c.caseId.trim() || !supported.has(c.institutionId) || !record(c.profile)) throw new Error('Invalid case identity/profile');
  const p = c.profile;
  if (Object.keys(p).some(k => !allowed.has(k))) throw new Error('Unsupported profile flag');
  if (('certificateType' in p && p.certificateType !== 'israeli_standard')
    || ('schoolSector' in p && p.schoolSector !== 'jewish_hebrew')) throw new Error('Unsupported certificate scope');
  if (!Array.isArray(p.bagrutSubjects) || !p.bagrutSubjects.length) throw new Error('Missing subjects');
  const names = new Set();
  for (const s of p.bagrutSubjects) {
    if (!record(s) || Object.keys(s).some(k => !['name', 'units', 'grade'].includes(k)) || typeof s.name !== 'string' || !s.name.trim()
      || names.has(s.name) || !Number.isInteger(s.units) || s.units < 1 || s.units > 5 || !Number.isFinite(s.grade) || s.grade < 0 || s.grade > 100) throw new Error('Invalid/duplicate subject');
    names.add(s.name);
  }
  for (const k of ['psychometricGeneral', 'psychometricQuantEmphasis', 'psychometricVerbalEmphasis']) {
    if (k in p && (!Number.isInteger(p[k]) || p[k] < 200 || p[k] > 800)) throw new Error('Invalid actual PET score');
  }
  for (const k of ['psychometricQuant', 'psychometricVerbal', 'psychometricEnglish']) {
    if (k in p && (!Number.isInteger(p[k]) || p[k] < 50 || p[k] > 150)) throw new Error('Invalid actual PET section');
  }
  for (const [prefix, name] of [['math', 'מתמטיקה'], ['physics', 'פיזיקה']]) {
    const s = p.bagrutSubjects.find(s => s.name === name);
    for (const [suffix, field] of [['Units', 'units'], ['Grade', 'grade']]) {
      if (prefix + suffix in p && p[prefix + suffix] !== (s?.[field] ?? 0)) throw new Error('Conflicting subject override');
    }
  }
}
const input = fs.readFileSync(0, 'utf8');
if (Buffer.byteLength(input) > 1024 * 1024) throw new Error('Too many candidate inputs');
const cases = JSON.parse(input);
if (!Array.isArray(cases) || !cases.length) throw new Error('Nonempty case array required');
const keys = new Set();
for (const c of cases) {
  validate(c);
  const key = JSON.stringify([c.institutionId, c.caseId]);
  if (keys.has(key)) throw new Error('Duplicate candidate case');
  keys.add(key);
}
const rows = cases.map(c => {
  freeze(c.profile);
  return { caseId: c.caseId, institutionId: c.institutionId, input: c.profile,
    result: calculateInstitution(c.institutionId, c.profile), source: { sha256: sourceHash, kind: 'product_calculator', officiallyVerified: false } };
});
process.stdout.write(JSON.stringify(rows));
