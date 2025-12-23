import { useEffect } from "react";


export default function Room() {
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);
  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>1v1 Coding Room</h1>

      <p>You are now in a match.</p>

      <div style={{ marginTop: "20px" }}>
        <h3>Problem</h3>
        <p>Reverse a linked list.</p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Editor (placeholder)</h3>
        <textarea rows="10" cols="50" />
      </div>
    </div>
  );
}
