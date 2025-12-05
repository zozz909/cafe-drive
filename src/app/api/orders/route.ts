import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Order } from '@/lib/types';
import { ResultSetHeader } from 'mysql2';

// تخزين مؤقت للطلبات (للتجربة بدون قاعدة بيانات)
const demoOrders: Order[] = [];

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CF${timestamp}${random}`.substring(0, 10);
}

export async function GET() {
  try {
    const orders = await query<Order[]>(
      `SELECT * FROM orders ORDER BY
       CASE status
         WHEN 'pending' THEN 1
         WHEN 'preparing' THEN 2
         WHEN 'ready' THEN 3
         ELSE 4
       END, created_at DESC`
    );
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    // إرجاع الطلبات المؤقتة
    return NextResponse.json(demoOrders);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, customer_phone, car_type, car_color, car_plate, order_type, notes, items } = body;

    const orderNumber = generateOrderNumber();
    const totalAmount = items.reduce((sum: number, item: { price: number; quantity: number }) =>
      sum + (item.price * item.quantity), 0);

    try {
      const orderResult = await query<ResultSetHeader>(
        `INSERT INTO orders (order_number, customer_name, customer_phone, car_type, car_color, car_plate, order_type, total_amount, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNumber, customer_name, customer_phone, car_type, car_color, car_plate, order_type, totalAmount, notes]
      );

      const orderId = orderResult.insertId;

      for (const item of items) {
        await query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.product_name, item.quantity, item.price, item.price * item.quantity]
        );
      }

      return NextResponse.json({
        success: true,
        order_number: orderNumber,
        order_id: orderId
      });
    } catch {
      // حفظ في الذاكرة المؤقتة
      const newOrder: Order = {
        id: demoOrders.length + 1,
        order_number: orderNumber,
        customer_name,
        customer_phone: customer_phone || '',
        car_type: car_type || '',
        car_color: car_color || '',
        car_plate: car_plate || '',
        order_type,
        status: 'pending',
        total_amount: totalAmount,
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      demoOrders.unshift(newOrder);

      return NextResponse.json({
        success: true,
        order_number: orderNumber,
        order_id: newOrder.id
      });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'فشل في إنشاء الطلب' }, { status: 500 });
  }
}

