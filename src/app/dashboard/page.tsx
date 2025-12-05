'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon, 
  FireIcon, 
  CheckCircleIcon, 
  TruckIcon,
  XCircleIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/solid';
import { Order } from '@/lib/types';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'انتظار', color: 'bg-yellow-500', icon: ClockIcon },
  preparing: { label: 'جاري التحضير', color: 'bg-orange-500', icon: FireIcon },
  ready: { label: 'جاهز', color: 'bg-green-500', icon: CheckCircleIcon },
  delivered: { label: 'تم التسليم', color: 'bg-blue-500', icon: TruckIcon },
  cancelled: { label: 'ملغي', color: 'bg-red-500', icon: XCircleIcon },
};

const nextStatus: Record<string, string> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast.success('تم تحديث حالة الطلب');
      fetchOrders();
    } catch {
      toast.error('فشل في تحديث الحالة');
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-l from-amber-600 to-amber-700 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-3xl">☕</span>
            <div>
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              <p className="text-amber-200 text-sm">إدارة الطلبات</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-xl">
              <span className="font-bold text-2xl">{activeOrders.length}</span>
              <span className="text-amber-200 mr-2 text-sm">طلب نشط</span>
            </div>
            <button onClick={fetchOrders} className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition">
              <ArrowPathIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(['all', 'pending', 'preparing', 'ready', 'delivered'] as const).map((status) => {
            const count = status === 'all' ? orders.length : orders.filter(o => o.status === status).length;
            const config = status === 'all' 
              ? { label: 'الكل', color: 'bg-gray-600', icon: BuildingStorefrontIcon }
              : statusConfig[status];
            return (
              <button key={status} onClick={() => setFilter(status)}
                className={`p-4 rounded-2xl transition-all ${filter === status ? config.color + ' text-white shadow-lg scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <config.icon className="w-6 h-6 mx-auto mb-1" />
                <p className="font-bold text-lg">{count}</p>
                <p className="text-sm opacity-80">{config.label}</p>
              </button>
            );
          })}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                const canAdvance = nextStatus[order.status];
                
                return (
                  <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className={`bg-white rounded-2xl shadow-lg overflow-hidden border-r-4 ${config.color.replace('bg-', 'border-')}`}>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-2xl font-bold text-gray-800">#{order.order_number}</span>
                          <div className={`inline-flex items-center gap-1 ${config.color} text-white px-2 py-1 rounded-lg text-xs mr-2`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.order_type === 'drive_thru' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {order.order_type === 'drive_thru' ? '🚗 درايف ثرو' : '🏪 استلام'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p><span className="font-medium">العميل:</span> {order.customer_name}</p>
                        {order.car_type && <p><span className="font-medium">السيارة:</span> {order.car_type} {order.car_color} - {order.car_plate}</p>}
                        <p><span className="font-medium">المبلغ:</span> <span className="text-amber-600 font-bold">{order.total_amount} ر.س</span></p>
                      </div>
                      
                      <div className="flex gap-2">
                        {canAdvance && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => updateStatus(order.id, canAdvance)}
                            className={`flex-1 ${statusConfig[canAdvance as keyof typeof statusConfig].color} text-white py-2 px-4 rounded-xl font-medium text-sm`}>
                            {statusConfig[canAdvance as keyof typeof statusConfig].label} ←
                          </motion.button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button onClick={() => updateStatus(order.id, 'cancelled')}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm hover:bg-red-200 transition">
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
