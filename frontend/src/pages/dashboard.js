import { useEffect, useState } from "react";
import Page from "../components/Page";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Dashboard() {
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
        }
    }, []);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        fetch(`${API_BASE}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then(setUser);
    }, []);

    if (!user) return <p>Loading...</p>;

    return (
        <div style={{ padding: "40px" }}>
            <h1>Dashboard</h1>

            <p>
                <strong>Username:</strong> {user.username}
            </p>

            <p>
                <strong>Codeforces Handle:</strong> {user.cfHandle}
            </p>
        </div>
    );
}
