import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, CheckCircle, XCircle, Search, ExternalLink, Activity } from "lucide-react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Practice() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [submissionId, setSubmissionId] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    
    // Focused Mode States
    const [focusedMode, setFocusedMode] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [secondsLeft, setSecondsLeft] = useState(0);
    
    // Filters
    const [minRating, setMinRating] = useState("800");
    const [maxRating, setMaxRating] = useState("1600");
    const [currentPage, setCurrentPage] = useState(1);

    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchProblems();
    }, [currentPage]);

    useEffect(() => {
        let timer;
        if (focusedMode && secondsLeft > 0) {
            timer = setInterval(() => {
                setSecondsLeft(s => s - 1);
            }, 1000);
        } else if (secondsLeft === 0 && focusedMode) {
            toast({ title: "Time's Up!", description: "Your focused session has ended.", variant: "destructive" });
            setFocusedMode(false);
        }
        return () => clearInterval(timer);
    }, [focusedMode, secondsLeft]);

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const startFocusedSession = () => {
        if (!selectedProblem) return;
        setFocusedMode(true);
        setSecondsLeft(durationMinutes * 60);
    };

    const fetchProblems = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${API_BASE}/practice/problems?minRating=${minRating}&maxRating=${maxRating}&page=${currentPage}&limit=20`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (Array.isArray(data)) setProblems(data);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to fetch practice problems", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!submissionId.trim() || !selectedProblem) return;
        setIsVerifying(true);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${API_BASE}/practice/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    problemId: selectedProblem.problemId,
                    submissionId
                })
            });
            const data = await res.json();

            if (!res.ok) {
                toast({ title: "Submission Failed", description: data.error, variant: "destructive" });
            } else if (data.verdict === "OK") {
                toast({ title: "Correct!", description: "Problem solved successfully. XP accumulated!" });
                setSubmissionId("");
                setSelectedProblem(null);
            } else {
                toast({ title: "Incorrect", description: data.message, variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Could not verify submission", variant: "destructive" });
        } finally {
            setIsVerifying(false);
        }
    };

    // Fullscreen Focused Mode UI
    if (focusedMode) {
        const timePercent = (secondsLeft / (durationMinutes * 60)) * 100;
        const isLowTime = secondsLeft < 120;

        return (
            <div className="fixed inset-0 z-[100] bg-background flex flex-col">
                {/* Header with timer */}
                <header className="flex justify-between items-center px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <Activity className="h-6 w-6 text-primary animate-pulse" />
                        <h2 className="font-display font-bold text-lg">{selectedProblem?.problemId} - {selectedProblem?.name}</h2>
                    </div>

                    <div className={`flex items-center gap-3 border px-6 py-2 rounded-full ${isLowTime ? 'border-destructive/50 bg-destructive/10' : 'border-primary/50 bg-primary/10'}`}>
                        <span className={`font-mono text-xl font-bold ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'}`}>{formatTime(secondsLeft)}</span>
                    </div>

                    <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setFocusedMode(false)}>
                        <XCircle className="h-4 w-4 mr-2" /> End Session
                    </Button>
                </header>

                {/* Timer progress bar */}
                <div className="w-full h-1 bg-secondary shrink-0">
                    <div 
                        className={`h-full transition-all duration-1000 ease-linear ${isLowTime ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${timePercent}%` }}
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
                        
                        {/* Problem Info Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="font-display text-3xl font-bold mb-3">{selectedProblem?.name}</h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-mono text-sm px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            Rating: {selectedProblem?.rating}
                                        </span>
                                        <span className="font-mono text-sm px-3 py-1 rounded-full bg-secondary text-foreground">
                                            {selectedProblem?.problemId}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedProblem?.tags?.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground mb-2 font-medium">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProblem.tags.map(tag => (
                                            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <a
                                href={selectedProblem?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <Button variant="hero" size="lg" className="w-full text-lg py-6 group">
                                    Open Problem on Codeforces
                                    <ExternalLink className="h-5 w-5 ml-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </Button>
                            </a>
                        </motion.div>

                        {/* Workflow Steps */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8"
                        >
                            <h3 className="font-display font-bold text-lg mb-6">How It Works</h3>
                            <div className="space-y-4">
                                {[
                                    { step: "1", text: "Read the problem on Codeforces (opens in a new tab)" },
                                    { step: "2", text: "Write and submit your solution on Codeforces" },
                                    { step: "3", text: "Copy your Submission ID from the CF submission page" },
                                    { step: "4", text: "Paste the ID below to verify and earn XP" },
                                ].map(({ step, text }) => (
                                    <div key={step} className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-mono text-sm font-bold text-primary shrink-0">
                                            {step}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Verification Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl border border-primary/30 bg-card/50 backdrop-blur-sm p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <h3 className="font-display font-bold text-lg">Verify Your Submission</h3>
                            </div>

                            <div className="flex gap-3">
                                <Input
                                    placeholder="Paste CF Submission ID (e.g. 235619)"
                                    value={submissionId}
                                    onChange={(e) => setSubmissionId(e.target.value)}
                                    className="font-mono flex-1"
                                />
                                <Button 
                                    variant="hero" 
                                    onClick={handleVerify}
                                    disabled={isVerifying || !submissionId.trim()}
                                    className="min-w-[140px]"
                                >
                                    {isVerifying ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Checking...
                                        </div>
                                    ) : "Verify"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background mt-16 pb-12">
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3">
                            <Activity className="h-8 w-8 text-primary" />
                            Practice Arena
                        </h1>
                        <p className="text-muted-foreground">Master your skills without the pressure of live combat.</p>
                    </div>

                    <div className="flex bg-card/50 p-2 rounded-xl border border-border/50 items-center justify-center gap-3">
                        <Input
                            type="number"
                            placeholder="Min Rating"
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            className="w-28 bg-background"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="number"
                            placeholder="Max Rating"
                            value={maxRating}
                            onChange={(e) => setMaxRating(e.target.value)}
                            className="w-28 bg-background"
                        />
                        <Button variant="default" onClick={() => { setCurrentPage(1); fetchProblems(); }}>
                            <Search className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Problem List */}
                    <div className="lg:col-span-2 space-y-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="h-8 w-8 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : problems.length === 0 ? (
                            <div className="text-center p-8 bg-card/30 rounded-xl border border-border/50">
                                <p className="text-muted-foreground">No problems found for this rating range.</p>
                            </div>
                        ) : (
                            problems.map((p, i) => (
                                <motion.div
                                    key={p.problemId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`p-5 rounded-xl border cursor-pointer hover:border-primary/50 transition-all ${
                                        selectedProblem?.problemId === p.problemId 
                                        ? "bg-primary/10 border-primary" 
                                        : "bg-card/50 border-border/50"
                                    }`}
                                    onClick={() => setSelectedProblem(p)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-display font-semibold text-lg">{p.problemId} - {p.name}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className="font-mono text-sm px-2.5 py-0.5 rounded-full bg-secondary text-foreground">
                                                    Rating: {p.rating}
                                                </span>
                                                {p.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-6">
                            <Button 
                                variant="outline" 
                                disabled={currentPage === 1 || loading}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                Previous Page
                            </Button>
                            <span className="font-mono text-muted-foreground">Page {currentPage}</span>
                            <Button 
                                variant="outline" 
                                disabled={problems.length < 20 || loading}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next Page
                            </Button>
                        </div>
                    </div>

                    {/* Verification Sidebar */}
                    <div className="lg:col-span-1">
                        <AnimatePresence mode="popLayout">
                            {!selectedProblem ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-8 text-center bg-card/30 rounded-xl border border-border/50 text-muted-foreground sticky top-24"
                                >
                                    <Trophy className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                    Select a problem from the list to start practicing!
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 bg-card/50 backdrop-blur-sm shadow-xl rounded-xl border border-primary/50 sticky top-24"
                                >
                                    <h3 className="font-display font-bold text-xl mb-2 text-primary">Solving: {selectedProblem.problemId}</h3>
                                    <p className="font-medium mb-4">{selectedProblem.name}</p>

                                    <div className="space-y-4 mb-6 pt-4 border-t border-border/50">
                                        <label className="text-sm text-muted-foreground font-medium block">
                                            Focused Duration
                                        </label>
                                        <select 
                                            className="w-full bg-background border border-border/50 rounded-md p-2 text-sm"
                                            value={durationMinutes}
                                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                        >
                                            <option value={15}>15 Minutes (Sprint)</option>
                                            <option value={30}>30 Minutes (Standard)</option>
                                            <option value={45}>45 Minutes (Extended)</option>
                                            <option value={60}>60 Minutes (Deep Work)</option>
                                            <option value={120}>120 Minutes (Full Contest)</option>
                                        </select>
                                    </div>
                                    <Button variant="hero" className="w-full group" onClick={startFocusedSession}>
                                        Start Focused Session
                                        <ExternalLink className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </Button>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
