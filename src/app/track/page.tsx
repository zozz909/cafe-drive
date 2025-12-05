'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, ClockIcon, FireIcon, CheckCircleIcon, TruckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Order } from '@/lib/types';

const statusSteps = [
  { key: 'pending', label: 'تم الاستلام', icon: ClockIcon },
  { key: 'preparing', label: 'جاري التحضير', icon: FireIcon },
  { key: 'ready', label: 'جاهز للاستلام', icon: CheckCircleIcon },
  { key: 'delivered', label: 'تم التسليم', icon: TruckIcon },
];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (!res.ok) {
        setError('لم يتم العثور على الطلب');
        return;
      }
      const data = await res.json();
      setOrder(data);
    } catch {
      setError('حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? statusSteps.findIndex(s => s.key === order.status) : -1;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-gradient-to-l from-amber-500 via-amber-600 to-orange-500 text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/" className="inline-block mb-4 text-amber-100 hover:text-white">→ العودة للقائمة</Link>
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <span className="text-4xl">📦</span>
            تتبع طلبك
          </h1>
          <p className="text-amber-100 mt-2">أدخل رقم الطلب لمعرفة حالته</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="أدخل رقم الطلب (مثال: CF12345)"
              className="w-full px-6 py-5 pr-14 text-lg rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white p-3 rounded-xl hover:bg-amber-600 disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="w-6 h-6" />
            </button>
          </div>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-100 text-red-700 p-4 rounded-xl text-center mb-6">
            {error}
          </motion.div>
        )}

        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-l from-amber-500 to-amber-600 text-white p-6 text-center">
              <p className="text-amber-100">رقم الطلب</p>
              <h2 className="text-4xl font-bold mt-1">#{order.order_number}</h2>
            </div>

            <div className="p-6">
              {/* Progress Steps */}
              <div className="flex justify-between mb-8 relative">
                <div className="absolute top-5 right-0 left-0 h-1 bg-gray-200 z-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                    className="h-full bg-amber-500"
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {statusSteps.map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center z-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'} ${isCurrent ? 'ring-4 ring-amber-200' : ''}`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </motion.div>
                      <p className={`text-xs mt-2 text-center ${isActive ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>{step.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">العميل:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">نوع الطلب:</span>
                  <span className="font-medium">{order.order_type === 'drive_thru' ? '🚗 درايف ثرو' : '🏪 استلام'}</span>
                </div>
                {order.car_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">السيارة:</span>
                    <span className="font-medium">{order.car_type} {order.car_color}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-500">المجموع:</span>
                  <span className="font-bold text-xl text-amber-600">{order.total_amount} ر.س</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
