import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Customer extends RowDataPacket {
  id: number;
  phone: string;
  pin: string;
  name: string | null;
  email: string | null;
}

// تسجيل الدخول بالرمز السري
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    if (!phone || !pin) {
      return NextResponse.json({ error: 'البيانات ناقصة' }, { status: 400 });
    }

    const customers = await query<Customer[]>(
      'SELECT id, phone, pin, name, email FROM customers WHERE phone = ?',
      [phone]
    );

    if (customers.length === 0) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    const customer = customers[0];

    if (customer.pin !== pin) {
      return NextResponse.json({ error: 'الرمز السري غير صحيح' }, { status: 401 });
    }

    // تسجيل دخول ناجح
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

