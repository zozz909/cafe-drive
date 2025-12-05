'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TruckIcon, BuildingStorefrontIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [orderType, setOrderType] = useState<'drive_thru' | 'pickup'>('pickup');
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    car_type: '',
    car_color: '',
    car_plate: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: Number(item.product.price)
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, order_type: orderType, items: orderItems })
      });

      const data = await res.json();
      if (data.success) {
        setOrderNumber(data.order_number);
        clearCart();
        toast.success('تم إرسال طلبك بنجاح!', { icon: '🎉' });
      }
    } catch {
      toast.error('حدث خطأ في إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOrderNumber(null);
    setFormData({ customer_name: '', customer_phone: '', car_type: '', car_color: '', car_plate: '', notes: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {orderNumber ? (
              <div className="p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">تم استلام طلبك!</h2>
                <p className="text-gray-500 mb-4">رقم الطلب</p>
                <div className="bg-amber-100 text-amber-800 text-3xl font-bold py-4 px-8 rounded-2xl inline-block mb-6">{orderNumber}</div>
                <p className="text-gray-600 mb-6">سيتم تحضير طلبك قريباً. يرجى الانتظار.</p>
                <button onClick={handleClose} className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition">
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="p-4 border-b bg-gradient-to-l from-amber-500 to-amber-600 text-white flex justify-between items-center">
                  <h2 className="text-xl font-bold">إتمام الطلب</h2>
                  <button type="button" onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setOrderType('pickup')}
                      className={`p-4 rounded-2xl border-2 transition-all ${orderType === 'pickup' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                      <BuildingStorefrontIcon className={`w-8 h-8 mx-auto mb-2 ${orderType === 'pickup' ? 'text-amber-500' : 'text-gray-400'}`} />
                      <p className="font-bold">استلام</p>
                    </button>
                    <button type="button" onClick={() => setOrderType('drive_thru')}
                      className={`p-4 rounded-2xl border-2 transition-all ${orderType === 'drive_thru' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                      <TruckIcon className={`w-8 h-8 mx-auto mb-2 ${orderType === 'drive_thru' ? 'text-amber-500' : 'text-gray-400'}`} />
                      <p className="font-bold">درايف ثرو</p>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <input type="text" placeholder="الاسم *" required value={formData.customer_name}
                      onChange={e => setFormData({...formData, customer_name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
                    <input type="tel" placeholder="رقم الجوال" value={formData.customer_phone}
                      onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder="نوع السيارة" value={formData.car_type}
                        onChange={e => setFormData({...formData, car_type: e.target.value})}
                        className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500" />
                      <input type="text" placeholder="اللون" value={formData.car_color}
                        onChange={e => setFormData({...formData, car_color: e.target.value})}
                        className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500" />
                      <input type="text" placeholder="رقم اللوحة" value={formData.car_plate}
                        onChange={e => setFormData({...formData, car_plate: e.target.value})}
                        className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <textarea placeholder="ملاحظات إضافية..." value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 h-20" />
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>المجموع:</span>
                      <span className="text-amber-600">{getTotalPrice().toFixed(2)} ر.س</span>
                    </div>
                  </div>
                  
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">
                    {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

