import { NextResponse } from 'next/server';
import api from '../../../../lib/api';

export async function PATCH(request) {
  try {
    const { data } = await api.patch('/notifications/mark-all-read');
    return NextResponse.json(data);
  } catch (err) {
    console.error('Mark all notifications read API error:', err);
    return NextResponse.json(
      { error: err.response?.data?.error || err.message },
      { status: err.response?.status || 500 }
    );
  }
}
