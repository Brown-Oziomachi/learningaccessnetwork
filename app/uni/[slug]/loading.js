export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f1ea" }}>
      <div style={{ height: 420, background: "#0d2244" }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24,
        display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ aspectRatio: "3/4", background: "#e5ddd0" }} />
        ))}
      </div>
    </div>
  );
}