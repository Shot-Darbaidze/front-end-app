"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Article } from "./articles";

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-6 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${article.categoryColor}`}
            >
              {article.category}
            </span>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {article.title}
            </h2>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {article.summary}
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 shrink-0 mt-1 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-5 space-y-3">
            {article.content.map((paragraph, idx) => {
              const isBullet = paragraph.startsWith("•");
              const isNumbered = /^\d+\./.test(paragraph);
              const isHeading =
                paragraph.endsWith(":") && !isBullet && !isNumbered;
              const isTip = paragraph.startsWith("რჩევა:");

              if (isTip) {
                return (
                  <div
                    key={idx}
                    className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
                  >
                    <p className="text-sm text-blue-800 font-medium">
                      {paragraph}
                    </p>
                  </div>
                );
              }

              if (isHeading) {
                return (
                  <h3
                    key={idx}
                    className="text-sm font-bold text-gray-900 mt-4 pt-2"
                  >
                    {paragraph}
                  </h3>
                );
              }

              if (isBullet) {
                return (
                  <p key={idx} className="text-sm text-gray-700 pl-2">
                    {paragraph}
                  </p>
                );
              }

              if (isNumbered) {
                return (
                  <p
                    key={idx}
                    className="text-sm font-semibold text-gray-800 mt-3"
                  >
                    {paragraph}
                  </p>
                );
              }

              return (
                <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
};
