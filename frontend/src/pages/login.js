import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Page from "../components/Page";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Login() {
    const router = useRouter();
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    async function handleLogin(e) {
        e.preventDefault();
        setError(null);

        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || "Login failed");
            return;
        }

        sessionStorage.setItem("token", data.token);
        router.push("/");
    }

    return (
        <Page>
            {
                <div style={{ padding: "40px", fontFamily: "Arial" }}>
                    <h1>Login to PairPrep</h1>

                    <form onSubmit={handleLogin}>
                        <input
                            placeholder="Username"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                        <br /><br />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <br /><br />

                        <button type="submit">Login</button>
                    </form>

                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <p style={{ marginTop: "20px" }}>
                        New here? <Link href="/signup">Create an account</Link>
                    </p>

                </div>
            }
        </Page>
    );
}
