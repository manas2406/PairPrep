import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();

  function logout() {
    sessionStorage.clear();
    router.push("/login");
  }

  return (
    <div
      style={{
        padding: "12px 24px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <strong>PairPrep</strong>

      <div style={{ display: "flex", gap: "16px" }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
