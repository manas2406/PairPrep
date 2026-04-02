import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Swords,
    ExternalLink,
    Send,
    LogOut,
    Clock,
    User,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    Copy,
    Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LandingPage from "@/components/LandingPage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
    const router = useRouter();
    const socketRef = useRef(null);

    // App states
    const [currentUser, setCurrentUser] = useState(null);
    const [status, setStatus] = useState("Idle"); // Idle | Searching... | Matched | Finished | Verifying...
    const [roomId, setRoomId] = useState(null);
    const [problem, setProblem] = useState(null);
    const [submissionId, setSubmissionId] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Chat
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);

    // Timer
    const [seconds, setSeconds] = useState(0);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        // We do NOT forcefully redirect to login here so the Landing Page can be seen
        // But we fetch the current user if a token exists
        if (token) {
            fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setCurrentUser(data.username))
                .catch(console.error);
        }
    }, []);

    /* ---------------- SOCKET SETUP ---------------- */
    useEffect(() => {
        if (socketRef.current) return;

        const token = sessionStorage.getItem("token");
        if (!token) return;

        const socket = io(API_BASE, {
            auth: { token },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            // Auto-start match if query param exists
            if (router.query.action === "find_match") {
                findMatch(router.query.rating || "800");
            }
        });

        socket.on("chat_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on("match_found", (data) => {
            setRoomId(data.roomId);
            setProblem(data.problem);
            setStatus("Matched");
            setMessages([]);
            setResult(null);
            setSubmissionId("");
            setError(null);
            setSeconds(0);

            toast({
                title: "Match Found!",
                description: `Get ready to solve: ${data.problem.name}`,
            });

            const timer = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
            socketRef.current.timer = timer;

            socket.emit("join_room", { roomId: data.roomId });
        });

        socket.on("user_left", ({ userId }) => {
            setMessages((prev) => [
                ...prev,
                { userId: "SYSTEM", message: `${userId} left the room`, system: true },
            ]);
            if (socketRef.current?.timer) {
                clearInterval(socketRef.current.timer);
            }
        });

        socket.on("match_finished", ({ winner }) => {
            setResult(winner);
            setStatus("Finished");
            if (socketRef.current?.timer) {
                clearInterval(socketRef.current.timer);
            }

            toast({
                title: "Match Finished",
                description: `Winner is: ${winner}`,
                variant: winner === currentUser ? "default" : "destructive",
            });
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        // Sync solved problems automatically
        fetch(`${API_BASE}/cf/fetch-solved`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        return () => {
            if (socketRef.current?.timer) clearInterval(socketRef.current.timer);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [toast, router.query.action, router.query.rating]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    /* ---------------- MATCHMAKING ---------------- */
    async function findMatch(rating = "800") {
        const token = sessionStorage.getItem("token");
        if (!token) {
            router.push("/login"); // enforce login on find match
            return;
        }
        if (!socketRef.current) return;

        console.log("Starting match search with Socket ID:", socketRef.current.id);
        setStatus("Searching...");
        try {
            const res = await fetch(`${API_BASE}/match/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "x-socket-id": socketRef.current.id,
                },
                body: JSON.stringify({ rating }),
            });

            if (!res.ok) {
                const err = await res.json();
                toast({ title: "Matchmaking Failed", description: err.error || "Unknown error", variant: "destructive" });
                setStatus("Idle");
            }
        } catch (err) {
            toast({ title: "Matchmaking Error", description: "Could not connect to server", variant: "destructive" });
            setStatus("Idle");
        }
    }

    /* ---------------- SUBMISSION ---------------- */
    async function submitSolution() {
        if (!submissionId.trim()) {
            toast({ title: "Error", description: "Please enter a submission ID", variant: "destructive" });
            return;
        }

        setStatus("Verifying...");
        setError(null);

        const res = await fetch(`${API_BASE}/submission/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-socket-id": socketRef.current.id,
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify({ roomId, submissionId }),
        });

        if (res.status === 409) {
            setError("Judging in progress. Please retry in a few seconds.");
            toast({ title: "Wait", description: "Judging in progress. Please retry.", variant: "default" });
            setStatus("Matched");
            return;
        }

        const data = await res.json();

        if (!res.ok) {
            setError(data.error);
            toast({ title: "Submission Failed", description: data.error, variant: "destructive" });
            setStatus("Matched");
        } else {
            toast({ title: "Submission Correct", description: "Waiting for server to declare winner..." });
        }
    }

    /* ---------------- LEAVE ROOM ---------------- */
    function leaveRoom() {
        if (!socketRef.current || !roomId) return;

        socketRef.current.emit("leave_room", { roomId });

        setRoomId(null);
        setProblem(null);
        setMessages([]);
        setSubmissionId("");
        setResult(null);
        setError(null);
        router.push("/dashboard");
    }

    /* ---------------- UTILS ---------------- */
    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const copyProblemLink = () => {
        if (!problem) return;
        navigator.clipboard.writeText(problem.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !socketRef.current) return;

        socketRef.current.emit("chat_message", {
            roomId,
            message: chatInput,
        });
        setChatInput("");
    };


    /* ---------------- UI RENDER ---------------- */

    // If we are completely idle, render the stunning Landing Page
    if (status === "Idle" && !roomId) {
        return <LandingPage />;
    }

    // If searching or in a match, render the MatchRoom Layout
    const isTimeWarning = false;

    return (
        <div className="min-h-screen bg-background flex flex-col mt-16">
            {/* Header handled by global Navbar, but we can render a sub-header for Match state */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <span className="font-display font-bold">Match Status: {status}</span>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border ${isTimeWarning
                        ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-primary/50 bg-primary/10 text-primary"
                        }`}>
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-base font-bold">{formatTime(seconds)} Elapsed</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-6">
                {status === "Searching..." && (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <div className="h-16 w-16 mb-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <h2 className="text-2xl font-bold font-display">Finding opponent...</h2>
                        <p className="text-muted-foreground mt-2">Connecting you to a player with a similar rating.</p>
                        <Button variant="outline" className="mt-6" onClick={() => router.push("/dashboard")}>Cancel Search</Button>
                    </div>
                )}

                {roomId && (
                    <div className="grid lg:grid-cols-3 gap-6 h-full">
                        {/* Left Column - Problem & Submission */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Winner overlay if finished */}
                            {result && (
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl border border-primary/50 bg-primary/10 mb-6 text-center">
                                    <h2 className="text-3xl font-bold font-display text-primary">
                                        {result === currentUser ? "🏆 You won!" : "😞 You lost"}
                                    </h2>
                                    <p className="mt-2 text-muted-foreground">Winner: {result}</p>
                                </motion.div>
                            )}

                            {/* Problem Card */}
                            {problem && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Current Problem</p>
                                            <h2 className="font-display text-2xl font-bold">{problem.name}</h2>
                                            <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-mono">
                                                Rating: {problem.rating}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <a
                                            href={problem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                        >
                                            <Button variant="hero" className="group">
                                                Open on Codeforces
                                                <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ml-2" />
                                            </Button>
                                        </a>
                                        <Button variant="outline" onClick={copyProblemLink}>
                                            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                            {copied ? "Copied!" : "Copy Link"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Submission Box */}
                            {!result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        <h3 className="font-display text-lg font-semibold">Submit Your Solution</h3>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-4">
                                        After submitting your solution on Codeforces, paste the submission ID below to verify.
                                    </p>

                                    <div className="flex gap-3">
                                        <Input
                                            placeholder="e.g., 123456789"
                                            value={submissionId}
                                            onChange={(e) => setSubmissionId(e.target.value)}
                                            className="font-mono"
                                            disabled={status === "Verifying..."}
                                        />
                                        <Button
                                            variant="default"
                                            onClick={submitSolution}
                                            disabled={status === "Verifying..." || !submissionId}
                                            className="min-w-[140px]"
                                        >
                                            {status === "Verifying..." ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                                    Verifying...
                                                </div>
                                            ) : (
                                                "Submit Codeforces ID"
                                            )}
                                        </Button>
                                    </div>
                                    {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                                </motion.div>
                            )}

                            {/* Leave Room Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={leaveRoom}
                                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Leave Room
                                </Button>
                                {!result && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        <AlertCircle className="h-3 w-3 inline mr-1" />
                                        Leaving counts as a forfeit and you will lose rating.
                                    </p>
                                )}
                            </motion.div>
                        </div>

                        {/* Right Column - Chat */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-[600px] lg:h-auto"
                        >
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <h3 className="font-display font-semibold">Match Chat</h3>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, i) => {
                                    if (msg.system) {
                                        return (
                                            <div key={i} className="text-center text-xs text-muted-foreground my-2">
                                                {msg.message}
                                            </div>
                                        )
                                    }
                                    const isYou = msg.userId === currentUser;
                                    return (
                                        <div key={i} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                                            <div
                                                className={`max-w-[80%] rounded-lg px-4 py-2 ${isYou
                                                    ? "bg-primary/20 text-foreground"
                                                    : "bg-secondary text-foreground"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs font-medium">
                                                        {isYou ? "You" : msg.userId}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{msg.message}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" variant="default">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
