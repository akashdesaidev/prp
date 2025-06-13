import { NextResponse } from 'next/server';
import api from '../../../../lib/api';

export async function GET() {
  try {
    const { data } = await api.get('/api/health');
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
