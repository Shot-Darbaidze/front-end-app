import { Search } from "lucide-react";
import { memo } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  onReset?: () => void;
  showResetButton?: boolean;
}

const EmptyState = memo(({ 
  title, 
  description, 
  onReset, 
  showResetButton = true 
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Search className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">{description}</p>
      {showResetButton && onReset && (
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-[#F03D3D] text-white rounded-xl font-medium hover:bg-[#d62f2f] transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
