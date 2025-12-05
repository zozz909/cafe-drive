'use client';

import { motion } from 'framer-motion';
import { PlusIcon, StarIcon } from '@heroicons/react/24/solid';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`تمت إضافة ${product.name} للسلة`, {
      icon: '☕',
      position: 'bottom-center',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative h-32 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
        <span className="text-6xl">☕</span>
        {product.is_popular && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <StarIcon className="w-3 h-3" />
            مميز
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-amber-600">
            {Number(product.price).toFixed(2)}
            <span className="text-sm text-gray-400 mr-1">ر.س</span>
          </span>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAddToCart}
            className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl shadow-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

