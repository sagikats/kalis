import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { simulateRealisticSubscores } from '../../../utils/calculators/psychometricHelper';
import { calculateBguQuantitativeSekem } from '../bgu';

describe('BGU Fast Track Math & Subscore Scaling Regression Suite', () => {
	it('correctly simulates upgraded subscores and satisfies admission threshold >= 750', () => {
		const baseGen = 616;
		const baseQuant = 135;
		const baseVerbal = 125;
		const baseEng = 100;
		const baseQuantEmp = 628;

		// 1. With target 649, subscores advance proportionally according to headroom:
		const subs649 = simulateRealisticSubscores(649, baseGen, baseQuant, baseVerbal, baseEng, baseQuantEmp, undefined);
		assert.equal(subs649.quantSub, 138);
		assert.equal(subs649.verbalSub, 130);
		assert.equal(subs649.englishSub, 111);

		// With upgraded subscores and Bagrut 111.7, BGU Quantitative Sekem is 764 (well above 750):
		const sekem649 = calculateBguQuantitativeSekem(111.7, subs649.quantSub, subs649.verbalSub, subs649.englishSub);
		assert.equal(sekem649, 764);
		assert.ok(sekem649 >= 750);

		// 2. Proves that if BGU calculator is fed the OLD subscores (135, 125, 100), Sekem drops to 748-749:
		const oldSekem = calculateBguQuantitativeSekem(111.7, baseQuant, baseVerbal, baseEng);
		assert.ok(oldSekem === 748 || oldSekem === 749); // Explains exactly why the un-updated subscores yielded 749 in BGU!
	});
});
