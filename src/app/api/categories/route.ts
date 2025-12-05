import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Category } from '@/lib/types';

// بيانات تجريبية في حال فشل الاتصال بقاعدة البيانات
const demoCategories: Category[] = [
  { id: 1, name: 'قهوة ساخنة', icon: '☕', sort_order: 1 },
  { id: 2, name: 'قهوة باردة', icon: '🧊', sort_order: 2 },
  { id: 3, name: 'مشروبات منعشة', icon: '🍹', sort_order: 3 },
  { id: 4, name: 'حلويات', icon: '🍰', sort_order: 4 },
  { id: 5, name: 'وجبات خفيفة', icon: '🥪', sort_order: 5 },
];

export async function GET() {
  try {
    const categories = await query<Category[]>(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    );
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // استخدام البيانات التجريبية في حال الفشل
    return NextResponse.json(demoCategories);
  }
}

