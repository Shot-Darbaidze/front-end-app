const InstructorCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-200" />
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="h-7 w-24 bg-gray-200 rounded-lg" />
        <div className="h-7 w-20 bg-gray-200 rounded-lg" />
        <div className="h-7 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
};

export default InstructorCardSkeleton;
