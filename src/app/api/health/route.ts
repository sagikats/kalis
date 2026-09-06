import { NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';

export async function GET() {
	const institutions = dbRepository.getAllInstitutions();
	return NextResponse.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		version: '2.0.0',
		institutionsCount: institutions.length,
		modules: ['calculators', 'db', 'optimizer', 'api']
	});
}
