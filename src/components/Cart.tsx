'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/solid';
import { useCartStore } from '@/lib/store';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function Cart({ isOpen, onClose, onCheckout }: CartProps) {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b bg-gradient-to-l from-amber-500 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBagIcon className="w-6 h-6" />
                  سلة الطلب
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>السلة فارغة</p>
                  <p className="text-sm">أضف منتجات لبدء الطلب</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-gray-50 rounded-xl p-4 flex gap-4"
                  >
                    <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-3xl">☕</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{item.product.name}</h3>
                      <p className="text-amber-600 font-semibold">{Number(item.product.price).toFixed(2)} ر.س</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100">
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 bg-amber-500 text-white rounded-full shadow flex items-center justify-center hover:bg-amber-600">
                          <PlusIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeItem(item.product.id)}
                          className="mr-auto text-red-500 hover:text-red-600 p-2">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t bg-gray-50 space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-600">المجموع:</span>
                  <span className="text-2xl font-bold text-amber-600">{getTotalPrice().toFixed(2)} ر.س</span>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                  إتمام الطلب
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

