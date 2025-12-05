import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface Customer extends RowDataPacket {
  id: number;
  phone: string;
  pin: string;
  name: string | null;
  email: string | null;
}

// التحقق من وجود العميل
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'رقم الجوال مطلوب' }, { status: 400 });
    }

    const customers = await query<Customer[]>(
      'SELECT id, phone, pin, name, email FROM customers WHERE phone = ?',
      [phone]
    );

    if (customers.length > 0) {
      // العميل موجود - أرجع بياناته (بدون الـ PIN للأمان)
      return NextResponse.json({
        exists: true,
        hasPin: true,
        customer: {
          id: customers[0].id,
          phone: customers[0].phone,
          name: customers[0].name,
          email: customers[0].email
        }
      });
    }

    // العميل غير موجود
    return NextResponse.json({ exists: false, hasPin: false });
  } catch (error) {
    console.error('Error checking customer:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// إنشاء عميل جديد أو تحديث PIN
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, pin, name, email, action } = body;

    if (!phone || !pin) {
      return NextResponse.json({ error: 'البيانات ناقصة' }, { status: 400 });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'الرمز السري يجب أن يكون 4 أرقام' }, { status: 400 });
    }

    // التحقق من وجود العميل
    const existing = await query<Customer[]>(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (action === 'reset_pin') {
      // إعادة تعيين الرمز السري
      if (existing.length === 0) {
        return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
      }

      await query(
        'UPDATE customers SET pin = ? WHERE phone = ?',
        [pin, phone]
      );

      return NextResponse.json({ success: true, message: 'تم تغيير الرمز السري' });
    }

    if (existing.length > 0) {
      return NextResponse.json({ error: 'رقم الجوال مسجل مسبقاً' }, { status: 400 });
    }

    // إنشاء عميل جديد
    const result = await query<ResultSetHeader>(
      'INSERT INTO customers (phone, pin, name, email) VALUES (?, ?, ?, ?)',
      [phone, pin, name || null, email || null]
    );

    return NextResponse.json({
      success: true,
      customer_id: result.insertId,
      message: 'تم إنشاء الحساب بنجاح'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الحساب' }, { status: 500 });
  }
}

