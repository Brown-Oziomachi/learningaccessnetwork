// OrderSummary.jsx - Complete Component with PDF Thumbnail Support

// Helper function to generate thumbnail from PDF
const getThumbnailUrl = (book) => {
  if (!book)
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";

  // If book has driveFileId, generate thumbnail from PDF first page
  if (book.driveFileId) {
    return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  }

  // Extract driveFileId from embedUrl if available
  if (book.embedUrl) {
    const match = book.embedUrl.match(
      /\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/
    );
    if (match) {
      const fileId = match[1] || match[2] || match[3];
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
      }
    }
  }

  // Extract from pdfUrl if it's a Google Drive link
  if (book.pdfUrl && book.pdfUrl.includes("drive.google.com")) {
    const match = book.pdfUrl.match(/[-\w]{25,}/);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
    }
  }

  // Fallback to existing image or default
  return (
    book.image ||
    book.coverImage ||
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
  );
};

export const OrderSummary = ({ book }) => {
  if (!book) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
        <p className="text-gray-600">Loading order summary...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

      <div className="mb-4">
        <img
          src={getThumbnailUrl(book)}
          alt={book.title}
          className="w-full h-48 object-cover rounded-lg mb-3 border border-gray-200 bg-gray-100"
          onError={(e) => {
            console.log("Thumbnail failed to load, using fallback");
            e.target.src =
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
          }}
          loading="lazy"
        />
        <h4 className="font-bold text-gray-900">{book.title}</h4>
        <p className="text-sm text-gray-600">{book.author}</p>
        <p className="text-xs text-gray-500 mt-1">
          {book.pages} pages • {book.format}
        </p>
        {book.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {book.description}
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-blue-950">
            ₦ {book.price?.toLocaleString() || "0"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Processing Fee</span>
          <span className="font-semibold text-blue-950">₦ 0</span>
        </div>
        {book.discount && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount {book.discount}</span>
            <span className="font-semibold">
              - ₦ {((book.oldPrice || 0) - (book.price || 0)).toLocaleString()}
            </span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
          <span className="text-gray-600">Total</span>
          <span className="text-blue-950">
            ₦ {book.price?.toLocaleString() || "0"}
          </span>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-950">
          <strong>✓ Instant Access</strong>
          <br />
          Download your PDF immediately after payment
        </p>
      </div>

      {book.sellerName && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <strong>Sold by:</strong> {book.sellerName}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
