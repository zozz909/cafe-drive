'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBagIcon, MagnifyingGlassIcon, UserCircleIcon, ArrowRightOnRectangleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import Cart from '@/components/Cart';
import CheckoutModal from '@/components/CheckoutModal';
import { useCartStore } from '@/lib/store';
import { Category, Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface UserProfile {
  phone: string;
  pin: string;
  name?: string;
  email?: string;
}

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  // التحقق من تسجيل الدخول - تحويل لصفحة الدخول إذا ما كان مسجل
  useEffect(() => {
    const checkUser = () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('user_'));
      if (keys.length > 0) {
        const userData = JSON.parse(localStorage.getItem(keys[0]) || '{}');
        setUser(userData);
        setCheckingAuth(false);
        // إظهار بانر إكمال الملف إذا لم يكتمل
        if (!userData.name || !userData.email) {
          setShowProfileBanner(true);
        }
      } else {
        // غير مسجل دخول - تحويل لصفحة الدخول
        router.push('/login');
      }
    };
    checkUser();
  }, [router]);

  // جلب البيانات
  useEffect(() => {
    if (checkingAuth) return; // لا تجلب البيانات أثناء التحقق
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/products').then(res => res.json())
    ]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [checkingAuth]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchQuery || product.name.includes(searchQuery) || product.description?.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // حذف بيانات المستخدم من localStorage
      const keys = Object.keys(localStorage).filter(k => k.startsWith('user_'));
      keys.forEach(k => localStorage.removeItem(k));
      setUser(null);
      toast.success('تم تسجيل الخروج');
      router.push('/login');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  // حفظ الملف الشخصي
  const handleSaveProfile = (name: string, email: string) => {
    if (user) {
      const updatedUser = { ...user, name, email };
      localStorage.setItem(`user_${user.phone}`, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowProfileModal(false);
      setShowProfileBanner(false);
      toast.success('تم حفظ الملف الشخصي ✓');
    }
  };

  // عرض شاشة تحميل أثناء التحقق من تسجيل الدخول
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      {/* بانر إكمال الملف الشخصي */}
      <AnimatePresence>
        {showProfileBanner && user && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="bg-gradient-to-l from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-8 h-8" />
              <div>
                <p className="font-bold">أكمل ملفك الشخصي</p>
                <p className="text-sm text-blue-100">أضف اسمك وبريدك الإلكتروني</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm"
              >
                إكمال الآن
              </motion.button>
              <button onClick={() => setShowProfileBanner(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-gradient-to-l from-amber-500 via-amber-600 to-orange-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold flex items-center gap-3"
              >
                <span className="text-4xl">☕</span>
                كافي درايف
              </motion.h1>
              <p className="text-amber-100 mt-1">اطلب من سيارتك • Drive Thru & Pickup</p>
            </div>

            <div className="flex items-center gap-3">
              {/* زر الملف الشخصي */}
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileModal(true)}
                  className="bg-white/20 backdrop-blur p-3 rounded-2xl hover:bg-white/30 transition flex items-center gap-2"
                >
                  <UserCircleIcon className="w-6 h-6" />
                  {user.name && <span className="text-sm font-medium">{user.name}</span>}
                </motion.button>
              )}

              {/* زر السلة */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="relative bg-white/20 backdrop-blur p-4 rounded-2xl hover:bg-white/30 transition"
              >
                <ShoppingBagIcon className="w-7 h-7" />
                {getTotalItems() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                  >
                    {getTotalItems()}
                  </motion.span>
                )}
              </motion.button>

              {/* زر تسجيل الخروج */}
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="bg-red-500/80 backdrop-blur p-3 rounded-2xl hover:bg-red-600 transition"
                  title="تسجيل خروج"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-4 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-amber-300"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Categories */}
        <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-xl">لا توجد منتجات</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} />

      {/* Checkout Modal */}
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSave={handleSaveProfile}
        onLogout={handleLogout}
      />

      {/* Floating Cart Button (Mobile) */}
      {getTotalItems() > 0 && !isCartOpen && (
        <motion.button
          initial={{ y: 100 }} animate={{ y: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-l from-amber-500 to-amber-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold"
        >
          <ShoppingBagIcon className="w-6 h-6" />
          عرض السلة ({getTotalItems()})
        </motion.button>
      )}
    </main>
  );
}

// مكون الملف الشخصي
function ProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
  onLogout
}: {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (name: string, email: string) => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">الملف الشخصي</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* رقم الجوال */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">رقم الجوال</label>
            <div className="bg-gray-100 rounded-xl p-4 text-gray-600 flex items-center gap-2">
              <span>📱</span>
              <span dir="ltr">+966 {user.phone}</span>
            </div>
          </div>

          {/* الاسم */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 focus:border-amber-400 focus:outline-none text-left"
              dir="ltr"
            />
          </div>
        </div>

        {/* الأزرار */}
        <div className="mt-6 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(name, email)}
            disabled={!name || !email}
            className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white py-4 rounded-xl font-bold disabled:opacity-50"
          >
            حفظ التغييرات ✓
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full bg-red-50 text-red-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            تسجيل الخروج
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
