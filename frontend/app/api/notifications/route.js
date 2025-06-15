import { NextResponse } from 'next/server';
import api from '../../../lib/api';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';

    const { data } = await api.get(url);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Notifications API error:', err);
    return NextResponse.json(
      { error: err.response?.data?.error || err.message },
      { status: err.response?.status || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data } = await api.post('/notifications', body);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Notifications POST API error:', err);
    return NextResponse.json(
      { error: err.response?.data?.error || err.message },
      { status: err.response?.status || 500 }
    );
  }
}
