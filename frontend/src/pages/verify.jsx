import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swords, Code, Lock, ArrowRight, UserCheck, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const VerifyPage = () => {
    const [step, setStep] = useState(1);
    const [cfHandle, setCfHandle] = useState("");
    const [problemId, setProblemId] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();
    const { toast } = useToast();

    const handleStartVerification = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/verify/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cfHandle }),
            });

            const data = await res.json();

            if (!res.ok) {
                setIsLoading(false);
                toast({
                    title: "Verification Request Failed",
                    description: data.error || "Please check your Handle or invite code.",
                    variant: "destructive",
                });
                return;
            }

            setProblemId(data.problemId);
            setTimeLeft(data.expiresIn);
            setStep(2);
            setIsLoading(false);
            
            // Basic countdown
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) clearInterval(timer);
                    return prev - 1;
                });
            }, 1000);
            
        } catch (err) {
            console.error(err);
            setIsLoading(false);
            toast({
                title: "Error",
                description: "Failed to connect to the server.",
                variant: "destructive",
            });
        }
    };

    const handleConfirmVerification = async () => {
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/verify/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cfHandle }),
            });

            const data = await res.json();

            if (!res.ok) {
                setIsLoading(false);
                toast({
                    title: "Verification Failed",
                    description: data.error || "Token not found in your Codeforces profile.",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Identity Verified!",
                description: "You may now complete your registration.",
            });
            
            router.push(`/signup?token=${data.preVerifiedToken}&handle=${cfHandle}`);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
            toast({
                title: "Error",
                description: "An expected error occurred during confirmation.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden mt-16">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="relative z-10 text-center"
                >
                    <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-6 glow-primary animate-pulse-glow">
                        <ShieldCheck className="h-16 w-16 text-primary" />
                    </div>
                    <h2 className="font-display text-3xl font-bold mb-4">
                        Secure Authentication
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        To maintain a high quality of battles, PairPrep requires all players to prove ownership over their Codeforces identity.
                    </p>
                </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 mt-16">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                        <Swords className="h-8 w-8 text-primary transition-all duration-300 group-hover:rotate-12" />
                        <span className="font-display text-2xl font-bold">
                            Pair<span className="text-primary">Prep</span>
                        </span>
                    </Link>

                    <h1 className="font-display text-3xl font-bold mb-2">Verify Identity</h1>
                    <p className="text-muted-foreground mb-8">
                        {step === 1 ? "Link your Codeforces handle" : "Prove your identity with a submission"}
                    </p>

                    {step === 1 && (
                        <form onSubmit={handleStartVerification} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="handle" className="text-sm font-medium">
                                    Codeforces Handle
                                </Label>
                                <div className="relative">
                                    <Code className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="handle"
                                        type="text"
                                        placeholder="e.g. tourist"
                                        value={cfHandle}
                                        onChange={(e) => setCfHandle(e.target.value)}
                                        className="pl-12"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Requesting...
                                    </div>
                                ) : (
                                    <>
                                        Get Verification Token
                                        <ArrowRight className="h-5 w-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed">
                                <p className="mb-3"><strong>Step 1:</strong> Go to problem <strong>{problemId}</strong> on Codeforces.</p>
                                <p className="mb-3"><strong>Step 2:</strong> Submit any random garbage text to intentionally get a <strong>Compilation Error</strong>.</p>
                                <div className="mt-4 mb-4 flex justify-center items-center gap-2">
                                    <span className="font-mono text-xl font-bold text-primary tracking-wider px-4 py-2 border border-border/50 bg-background rounded-md shadow-sm">
                                        Problem {problemId}
                                    </span>
                                    <a 
                                      href={`https://codeforces.com/problemset/problem/${problemId.replace(/[A-Za-z]+/, '')}/${problemId.replace(/[0-9]+/, '')}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                        <Button variant="outline" size="sm" type="button">Open Problem</Button>
                                    </a>
                                </div>
                                <p className="mb-2"><strong>Step 3:</strong> Once you see the Compilation Error on your submissions page, click confirm below.</p>
                                
                                <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                                    <span>Time remaining:</span>
                                    <span className={`font-mono font-bold ${timeLeft < 30 ? "text-destructive" : "text-primary"}`}>
                                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirmVerification}
                                size="lg"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Verifying...
                                    </div>
                                ) : (
                                    <>
                                        <UserCheck className="h-5 w-5 mr-2" />
                                        I've Updated My Profile
                                    </>
                                )}
                            </Button>

                            <div className="mt-4 text-center">
                                <button 
                                    className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                                    onClick={() => setStep(1)}
                                >
                                    Cancel and go back
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Already verified?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default VerifyPage;
