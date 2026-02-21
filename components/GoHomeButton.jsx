'use client'

export default function GoHomeButton() {
  return (
    <div className="space-x-5">
    <button
      onClick={() => {
        window.location.href =
          "/lan/net/help-center";
      }}
      className="inline-flex items-center justify-center bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition"
    >
      Help center
    </button>
    </div>
  )
}
