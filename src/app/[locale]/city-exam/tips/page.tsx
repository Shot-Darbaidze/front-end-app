"use client";

import React, { useState } from "react";
import { CityExamNav } from "@/components/city-exam/CityExamNav";
import { ArticleCard } from "@/components/city-exam/tips/ArticleCard";
import { ARTICLES } from "@/components/city-exam/tips/articles";
import { BookOpen } from "lucide-react";

const CATEGORIES = [
  { label: "ყველა", value: "all" },
  { label: "მძიმე შეცდომები", value: "მძიმე შეცდომები" },
  { label: "მსუბუქი შეცდომები", value: "მსუბუქი შეცდომები" },
  { label: "მოედანი", value: "მოედანი" },
  { label: "ქალაქი", value: "ქალაქი" },
  { label: "ზოგადი", value: "ზოგადი" },
];

export default function TipsPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredArticles =
    activeCategory === "all"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
      <main className="pt-6 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F03D3D]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#F03D3D]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                რჩევები და ხრიკები
              </h1>
            </div>
            <p className="text-gray-600">
              მოემზადეთ გამოცდისთვის — ისწავლეთ ხშირი შეცდომები, რჩევები
              მოედნისთვის და ქალაქისთვის
            </p>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
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
              </button>
            ))}
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
        </div>
      </main>
    </div>
  );
}
