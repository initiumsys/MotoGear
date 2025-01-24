import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  parent_id?: string | null;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { t } = useTranslation();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(cat => cat.parent_id === parentId);

  const getCategoryTranslation = (name: string, isSubcategory: boolean = false): string => {
    const key = name.toLowerCase().replace(/\s+/g, '_');
    return isSubcategory 
      ? t(`categories.subcategories.${key}`, name)
      : t(`categories.${key}`, name);
  };

  const getCategoryDescription = (name: string): string => {
    const key = name.toLowerCase().replace(/\s+/g, '_');
    return t(`categories.description.${key}`, '');
  };

  const handleMouseEnter = (categoryId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredCategory(categoryId);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setHoveredCategory(null);
    }, 150); // Small delay before closing
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <ul className="flex items-center space-x-1">
          <li>
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative
                ${selectedCategory === null
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              title={t('categories.all')}
            >
              {t('categories.all')}
            </button>
          </li>
          
          {mainCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const hasSubcategories = subcategories.length > 0;
            const isHovered = hoveredCategory === category.id;
            
            return (
              <li
                key={category.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(category.id)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors inline-flex items-center gap-1
                    ${selectedCategory === category.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  title={getCategoryDescription(category.name)}
                >
                  {getCategoryTranslation(category.name)}
                  {hasSubcategories && <ChevronDown size={16} />}
                </button>

                {/* Dropdown for subcategories */}
                {hasSubcategories && isHovered && (
                  <div 
                    className="absolute left-0 top-full z-10 w-56 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                    onMouseEnter={() => handleMouseEnter(category.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onSelectCategory(sub.id)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors
                          ${selectedCategory === sub.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                      >
                        {getCategoryTranslation(sub.name, true)}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}