export const OrderSummary = ({ book }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

      <div className="mb-4">
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-48 object-cover rounded-lg mb-3"
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
            ₦ {book.price.toLocaleString()}
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
              - ₦ {(book.oldPrice - book.price).toLocaleString()}
            </span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
          <span className="text-gray-600">Total</span>
          <span className="text-blue-950">₦ {book.price.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-950">
          <strong>✓ Instant Access</strong>
          <br />
          Download your PDF immediately after payment
        </p>
      </div>
    </div>
  );
};
