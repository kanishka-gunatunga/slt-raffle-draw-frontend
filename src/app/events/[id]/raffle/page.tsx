"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RaffleDraw } from "@/components/RaffleDraw";
import api from "@/lib/api";
import { Participant, Gift } from "@/types";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function RafflePage() {
    const params = useParams();
    const eventId = params.id as string;

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [prizes, setPrizes] = useState<Gift[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [inputKey, setInputKey] = useState("");
    const [eventTitle, setEventTitle] = useState("");
    const [checking, setChecking] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setChecking(true);
        try {
            const { data: event } = await api.get(`/events/${eventId}`);
            if (event.enrollmentKey === inputKey) {
                setAuthorized(true);
                setEventTitle(event.title);
                setPrizes(event.gifts || []);
                fetchCandidates();
            } else {
                alert("Invalid Enrollment Key");
            }
        } catch (error) {
            console.error(error);
            alert("Error verifying key");
        } finally {
            setChecking(false);
        }
    };

    const fetchCandidates = async () => {
        try {
            const { data } = await api.get(`/raffle/candidates?eventId=${eventId}`);
            setParticipants(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch candidates", error);
        }
    };

    const handleWinnerRecorded = (userId: number) => {
        setParticipants(prev => prev.filter(p => p.id !== userId));
    };

    if (!authorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
                style={{
                    background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
                }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute opacity-20"
                            initial={{
                                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                                rotate: Math.random() * 360,
                                scale: Math.random() * 0.5 + 0.5
                            }}
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.3, 0.1]
                            }}
                            transition={{
                                duration: Math.random() * 10 + 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <Sparkles className="text-white w-12 h-12" />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-md"
                >
                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-blue-50 rounded-full">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold mb-2 text-center text-gray-800 tracking-tight" style={{ fontFamily: "Arial, sans-serif" }}>Restricted Access</h2>
                        <p className="text-gray-500 text-center mb-8" style={{ fontFamily: "Arial, sans-serif" }}>Enter the event key to access the raffle.</p>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-center text-lg tracking-widest uppercase font-mono shadow-inner"
                                    placeholder="ENTER KEY"
                                />
                            </div>
                            <button
                                disabled={checking}
                                className="w-full font-bold py-4 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white shadow-xl"
                                style={{
                                    background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                    fontFamily: "Arial, sans-serif",
                                    fontSize: "20px"
                                }}
                            >
                                {checking ? "Verifying..." : (
                                    <>
                                        ACCESS EVENT <Sparkles className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/50 font-medium tracking-widest uppercase text-sm">Loading Participants...</p>
                </div>
            </div>
        );
    }

    return (
        <RaffleDraw
            eventId={eventId}
            eventName={eventTitle}
            participants={participants}
            prizes={prizes}
            onWinnerRecorded={handleWinnerRecorded}
        />
    );
}
