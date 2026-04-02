import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swords, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const SignupPage = () => {
    const [username, setUsername] = useState("");
    const [cfHandle, setCfHandle] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    // Auth flow protection
    const token = router.query.token;
    const prefilledHandle = router.query.handle;
    
    useEffect(() => {
        if (router.isReady) {
            if (!token) {
                router.push("/verify");
            } else if (prefilledHandle) {
                setCfHandle(prefilledHandle);
            }
        }
    }, [router.isReady, token, prefilledHandle]);

    const passwordRequirements = [
        { text: "At least 8 characters", met: password.length >= 8 },
        { text: "Contains a number", met: /\d/.test(password) },
        { text: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordRequirements.every(req => req.met)) {
            toast({
                title: "Password requirements not met",
                description: "Please ensure your password meets all requirements.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: username, cfHandle, password, preVerifiedToken: token }),
            });

            const data = await res.json();

            if (!res.ok) {
                setIsLoading(false);
                toast({
                    title: "Signup failed",
                    description: data.error || "Failed to create account",
                    variant: "destructive",
                });
                return;
            }

            sessionStorage.setItem("token", data.token);
            toast({
                title: "Account created!",
                description: "Welcome to PairPrep. Let's start battling!",
            });
            router.push("/dashboard");
        } catch (err) {
            console.error(err)
            setIsLoading(false);
            toast({
                title: "Signup failed",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden mt-16">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="relative z-10 text-center"
                >
                    <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-6 glow-primary animate-pulse-glow">
                        <Swords className="h-16 w-16 text-primary" />
                    </div>
                    <h2 className="font-display text-3xl font-bold mb-4">
                        Join the Arena
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Create your account and start your journey to becoming a
                        competitive programming champion.
                    </p>

                    <div className="mt-8 space-y-4 text-left max-w-sm mx-auto">
                        {[
                            "Challenge players worldwide",
                            "Solve 10,000+ problems",
                            "Track your progress",
                            "Climb the leaderboards",
                        ].map((feature, i) => (
                            <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <div className="flex-shrink-0 rounded-full bg-accent/20 p-1">
                                    <Check className="h-4 w-4 text-accent" />
                                </div>
                                <span className="text-muted-foreground">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 mt-16">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                        <Swords className="h-8 w-8 text-primary transition-all duration-300 group-hover:rotate-12" />
                        <span className="font-display text-2xl font-bold">
                            Pair<span className="text-primary">Prep</span>
                        </span>
                    </Link>

                    <h1 className="font-display text-3xl font-bold mb-2">Create account</h1>
                    <p className="text-muted-foreground mb-8">
                        Enter your details to start your competitive journey
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Username
                            </Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Your battle name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cfHandle" className="text-sm font-medium">
                                Codeforces Handle
                            </Label>
                            <div className="relative">
                                <Code className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="cfHandle"
                                    type="text"
                                    placeholder="e.g. tourist"
                                    value={cfHandle}
                                    onChange={(e) => setCfHandle(e.target.value)}
                                    className="pl-12 bg-muted opacity-80"
                                    disabled
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {/* Password Requirements */}
                            <div className="mt-3 space-y-2">
                                {passwordRequirements.map((req) => (
                                    <div
                                        key={req.text}
                                        className={`flex items-center gap-2 text-sm transition-colors ${req.met ? "text-accent" : "text-muted-foreground"
                                            }`}
                                    >
                                        <div
                                            className={`h-1.5 w-1.5 rounded-full transition-colors ${req.met ? "bg-accent" : "bg-muted-foreground"
                                                }`}
                                        />
                                        {req.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Creating account...
                                </div>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>

                </motion.div>
            </div>
        </div>
    );
};

export default SignupPage;
