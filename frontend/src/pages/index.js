import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  function findMatch() {
    router.push("/match");
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>PairPrep</h1>

      <p>Status: <strong>Idle</strong></p>

      <button onClick={findMatch}>
        Find Match
      </button>
    </div>
  );
}