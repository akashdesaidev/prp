import { NextResponse } from 'next/server';
import api from '../../../../lib/api';

export async function GET(request) {
  try {
    const { data } = await api.get('/notifications/preferences');
    return NextResponse.json(data);
  } catch (err) {
    console.error('Get notification preferences API error:', err);
    return NextResponse.json(
      { error: err.response?.data?.error || err.message },
      { status: err.response?.status || 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { data } = await api.put('/notifications/preferences', body);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Update notification preferences API error:', err);
    return NextResponse.json(
      { error: err.response?.data?.error || err.message },
      { status: err.response?.status || 500 }
    );
  }
}
