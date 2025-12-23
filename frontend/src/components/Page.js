export default function Page({ children }) {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
