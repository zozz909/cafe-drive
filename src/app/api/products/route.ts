import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Product } from '@/lib/types';

// بيانات تجريبية
const demoProducts: Product[] = [
  { id: 1, category_id: 1, name: 'اسبريسو', description: 'قهوة اسبريسو إيطالية أصلية', price: 12, image: null, is_available: true, is_popular: true },
  { id: 2, category_id: 1, name: 'كابتشينو', description: 'اسبريسو مع حليب مخفوق ورغوة كريمية', price: 18, image: null, is_available: true, is_popular: true },
  { id: 3, category_id: 1, name: 'لاتيه', description: 'اسبريسو مع حليب ساخن', price: 16, image: null, is_available: true, is_popular: true },
  { id: 4, category_id: 1, name: 'موكا', description: 'اسبريسو مع شوكولاتة وحليب', price: 20, image: null, is_available: true, is_popular: false },
  { id: 5, category_id: 1, name: 'قهوة عربية', description: 'قهوة عربية أصيلة مع الهيل', price: 8, image: null, is_available: true, is_popular: true },
  { id: 6, category_id: 2, name: 'آيس لاتيه', description: 'لاتيه مثلج منعش', price: 18, image: null, is_available: true, is_popular: true },
  { id: 7, category_id: 2, name: 'آيس موكا', description: 'موكا مثلجة مع كريمة', price: 22, image: null, is_available: true, is_popular: false },
  { id: 8, category_id: 2, name: 'كولد برو', description: 'قهوة باردة مختمرة ببطء', price: 20, image: null, is_available: true, is_popular: true },
  { id: 9, category_id: 2, name: 'فرابتشينو كراميل', description: 'مشروب مثلج بالكراميل', price: 25, image: null, is_available: true, is_popular: true },
  { id: 10, category_id: 3, name: 'عصير برتقال طازج', description: 'عصير برتقال طبيعي 100%', price: 15, image: null, is_available: true, is_popular: false },
  { id: 11, category_id: 3, name: 'سموذي مانجو', description: 'سموذي المانجو الاستوائي', price: 18, image: null, is_available: true, is_popular: true },
  { id: 12, category_id: 3, name: 'ليموناضة', description: 'ليمون طازج مع نعناع', price: 12, image: null, is_available: true, is_popular: false },
  { id: 13, category_id: 4, name: 'تشيز كيك', description: 'تشيز كيك بالتوت', price: 25, image: null, is_available: true, is_popular: true },
  { id: 14, category_id: 4, name: 'براوني', description: 'براوني شوكولاتة ساخن', price: 18, image: null, is_available: true, is_popular: false },
  { id: 15, category_id: 4, name: 'كوكيز', description: 'كوكيز محشوة بالشوكولاتة', price: 10, image: null, is_available: true, is_popular: false },
  { id: 16, category_id: 5, name: 'كرواسون', description: 'كرواسون طازج بالزبدة', price: 12, image: null, is_available: true, is_popular: true },
  { id: 17, category_id: 5, name: 'ساندويش جبنة', description: 'ساندويش جبنة مشوية', price: 20, image: null, is_available: true, is_popular: false },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const popular = searchParams.get('popular');

    let sql = 'SELECT * FROM products WHERE is_available = TRUE';
    const params: unknown[] = [];

    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }

    if (popular === 'true') {
      sql += ' AND is_popular = TRUE';
    }

    sql += ' ORDER BY is_popular DESC, name ASC';

    const products = await query<Product[]>(sql, params);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    // استخدام البيانات التجريبية
    let filtered = demoProducts;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');

    if (categoryId) {
      filtered = filtered.filter(p => p.category_id === parseInt(categoryId));
    }

    return NextResponse.json(filtered);
  }
}

