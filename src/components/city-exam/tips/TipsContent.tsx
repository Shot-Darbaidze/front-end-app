"use client";

import React, { useState } from "react";
import { ArticleCard } from "@/components/city-exam/tips/ArticleCard";
import { ARTICLES } from "@/components/city-exam/tips/articles";

const CATEGORIES = [
  { label: "ყველა", value: "all" },
  { label: "მძიმე შეცდომები", value: "მძიმე შეცდომები" },
  { label: "მსუბუქი შეცდომები", value: "მსუბუქი შეცდომები" },
  { label: "ქალაქი", value: "ქალაქი" },
  { label: "ზოგადი", value: "ზოგადი" },
];

export default function TipsContent() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredArticles =
    activeCategory === "all"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => {
          const count =
            cat.value === "all"
              ? ARTICLES.length
              : ARTICLES.filter((a) => a.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat.value
                  ? "bg-[#F03D3D] text-white shadow-md shadow-red-500/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              {cat.label}
              <span
                className={`ml-1.5 text-xs ${
                  activeCategory === cat.value
                    ? "text-white/70"
                    : "text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          ამ კატეგორიაში სტატიები არ მოიძებნა
        </div>
      )}
    </>
  );
}
