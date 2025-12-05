import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Order, OrderItem } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const orders = await query<Order[]>(
      'SELECT * FROM orders WHERE id = ? OR order_number = ?',
      [id, id]
    );
    
    if (orders.length === 0) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }
    
    const order = orders[0];
    const items = await query<OrderItem[]>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );
    
    return NextResponse.json({ ...order, items });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'فشل في تحميل الطلب' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    await query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'فشل في تحديث الطلب' }, { status: 500 });
  }
}

