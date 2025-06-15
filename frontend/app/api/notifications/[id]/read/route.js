import { NextResponse } from 'next/server';
import api from '../../../../../lib/api';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { data } = await api.patch(`/notifications/${id}/read`);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Mark notification read API error:', err);
    return NextResponse.json(
      { error: err.response?.data?.error || err.message },
      { status: err.response?.status || 500 }
    );
  }
}
