import { Star, ThumbsUp } from "lucide-react";

export interface Review {
  id: string;
  studentName: string;
  rating: number;
  date: string;
  comment: string;
  tags?: string[];
  helpfulCount?: number;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
            {review.studentName.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{review.studentName}</h4>
            <p className="text-xs text-gray-500">{review.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-bold text-gray-900">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        {review.comment}
      </p>

      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {review.tags.map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-500 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50">
        <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful ({review.helpfulCount || 0})
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
