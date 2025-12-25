import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Page from "../components/Page";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Signup() {
    const router = useRouter();
    const [userId, setUserId] = useState("");
    const [cfHandle, setCfHandle] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    async function handleSignup(e) {
        e.preventDefault();
        setError(null);

        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, cfHandle, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || "Signup failed");
            return;
        }

        sessionStorage.setItem("token", data.token);
        router.push("/");
    }

    return (
        <Page>
            {
                <div style={{ padding: "40px", fontFamily: "Arial" }}>
                    <h1>Create PairPrep Account</h1>

                    <form onSubmit={handleSignup}>
                        <input
                            placeholder="Username"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                        <br /><br />

                        <input
                            placeholder="Codeforces Handle"
                            value={cfHandle}
                            onChange={(e) => setCfHandle(e.target.value)}
                        />
                        <br /><br />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <br /><br />

                        <button type="submit">Signup</button>
                    </form>

                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <p style={{ marginTop: "20px" }}>
                        Already have an account? <Link href="/login">Login</Link>
                    </p>
                </div>
            }
        </Page>
    );
}
