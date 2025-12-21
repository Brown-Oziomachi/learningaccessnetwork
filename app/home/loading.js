export default function HomeLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      
      {/* Header */}
      <div className="h-8 w-1/3 bg-blue-950 rounded"></div>

      {/* Hero Card */}
      <div className="h-48 bg-blue-950 rounded-xl"></div>

      {/* Section Title */}
      <div className="h-6 w-1/4 bg-blue-950 rounded"></div>

      {/* Book Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-40 bg-blue-950 rounded-lg"></div>
            <div className="h-4 bg-blue-950 rounded w-3/4"></div>
            <div className="h-4 bg-blue-950 rounded w-1/2"></div>
          </div>
        ))}
      </div>

    </div>
  );
}
