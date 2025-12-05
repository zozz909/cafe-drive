'use client';

import { motion } from 'framer-motion';
import { Category } from '@/lib/types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (categoryId: number | null) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
          selectedCategory === null
            ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
            : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
        }`}
      >
        <span className="ml-2">🍽️</span>
        الكل
      </motion.button>
      
      {categories.map((category) => (
        <motion.button
          key={category.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(category.id)}
          className={`flex-shrink-0 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
            selectedCategory === category.id
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
              : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
          }`}
        >
          <span className="ml-2">{category.icon}</span>
          {category.name}
        </motion.button>
      ))}
    </div>
  );
}

