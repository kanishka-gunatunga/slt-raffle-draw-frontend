"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gift, Sparkles, PartyPopper, Award } from "lucide-react";
import { Participant, Gift as Prize } from "@/types";
import api from "@/lib/api";
import confetti from "canvas-confetti";

import { getImageUrl } from "@/lib/utils";

interface RaffleDrawProps {
    eventId: string;
    eventName?: string;
    participants: Participant[];
    prizes: Prize[];
    onWinnerRecorded: (userId: number) => void;
}

export function RaffleDraw({ eventId, eventName = "Grand Raffle Draw", participants, prizes, onWinnerRecorded }: RaffleDrawProps) {

    const [hasStarted, setHasStarted] = useState(false);

    const sortedPrizes = [...prizes].sort((a, b) => b.rank - a.rank);
    const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);

    const [allWinners, setAllWinners] = useState<Set<number>>(new Set());
    const [winner, setWinner] = useState<Participant | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    // Magnetic Animation State
    const [shuffleSpeed, setShuffleSpeed] = useState(150);
    interface FloatingImage {
        id: number;
        participantIndex: number;
        x: number;
        y: number;
        scale: number;
        rotation: number;
    }
    const [floatingImages, setFloatingImages] = useState<FloatingImage[]>([]);
    const [magnetizedImages, setMagnetizedImages] = useState<number[]>([]);

    // Refs for animation
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const autoProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentPrize = sortedPrizes[currentPrizeIndex];
    const eligibleParticipants = participants.filter(p => !allWinners.has(p.id));

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (autoProgressTimeoutRef.current) clearTimeout(autoProgressTimeoutRef.current);
        };
    }, []);

    // Initialize floating images
    useEffect(() => {
        if (eligibleParticipants.length === 0) return;

        // Create 100 floating images positioned randomly around the screen
        const imageCount = 100;
        const newFloatingImages: FloatingImage[] = [];
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

        for (let i = 0; i < imageCount; i++) {
            const participantIndex = i % eligibleParticipants.length;
            newFloatingImages.push({
                id: i,
                participantIndex,
                x: Math.random() * windowWidth - windowWidth / 2,
                y: Math.random() * windowHeight - windowHeight / 2,
                scale: Math.random() * 0.5 + 0.5,
                rotation: Math.random() * 360,
            });
        }

        setFloatingImages(newFloatingImages);
        setMagnetizedImages([]);
    }, [eligibleParticipants.length, participants.length]);

    // Magnetic Animation Loop
    useEffect(() => {
        if (isAnimating && eligibleParticipants.length > 0) {
            intervalRef.current = setInterval(() => {
                // Change which image is being shown in the placeholder
                setSelectedIndex((prev) => (prev + 1) % eligibleParticipants.length);

                // Randomly magnetize images to the center (Stronger force: multiple at once)
                setMagnetizedImages((prev) => {
                    const newMagnetized = [...prev];
                    // Attract 3 images at a time for stronger effect
                    for (let i = 0; i < 3; i++) {
                        const randomImageId = Math.floor(Math.random() * floatingImages.length);
                        if (!newMagnetized.includes(randomImageId)) {
                            newMagnetized.push(randomImageId);
                        }
                    }
                    return newMagnetized.slice(-15); // Keep last 15 visible in the center pile
                });
            }, shuffleSpeed);

            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
    }, [isAnimating, shuffleSpeed, floatingImages.length, eligibleParticipants.length]);

    const handleStartDraw = () => {
        if (eligibleParticipants.length === 0) {
            alert("No eligible participants remaining!");
            return;
        }

        setIsAnimating(true);
        setWinner(null);
        setShuffleSpeed(400); // Much slower start (was 200) to ensure visibility

        // Gentler slow down logic
        const slowDownIntervals = [
            { time: 2000, speed: 500 },
            { time: 4000, speed: 600 },
            { time: 6000, speed: 800 },
        ];

        slowDownIntervals.forEach(({ time, speed }) => {
            setTimeout(() => setShuffleSpeed(speed), time);
        });

        // Duration of the spin (Increased to 8 seconds)
        const duration = 8000;

        // Stop logic
        setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsAnimating(false);

            // Pick Winner from eligible participants only
            const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
            const selectedWinner = eligibleParticipants[randomIndex];
            setWinner(selectedWinner);

            // Add to winners set
            setAllWinners(prev => new Set([...prev, selectedWinner.id]));

            // Trigger Confetti
            triggerConfetti();

            // Record winner
            if (currentPrize && selectedWinner) {
                api.post('/raffle/record-winner', {
                    eventId,
                    giftId: currentPrize.id,
                    userId: selectedWinner.id
                }).then(() => {
                    onWinnerRecorded(selectedWinner.id);
                }).catch(console.error);
            }

            // Auto-progress is disabled for manual flow
        }, duration);
    };

    const handleAutoProgress = () => {
        if (currentPrizeIndex < sortedPrizes.length - 1) {
            // Move to next prize
            setCurrentPrizeIndex(prev => prev + 1);
            setWinner(null);
        } else {
            // All prizes drawn - show completion
            setIsCompleted(true);
        }
    };

    const handleNextPrize = () => {
        // Clear auto-progress timeout if user manually clicks
        if (autoProgressTimeoutRef.current) {
            clearTimeout(autoProgressTimeoutRef.current);
        }
        handleAutoProgress();
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const getPlaceColor = (rank: number) => {
        if (rank === 1) return "from-yellow-400 to-yellow-600 border-yellow-300 shadow-yellow-500/50";
        if (rank === 2) return "from-gray-300 to-gray-500 border-gray-300 shadow-gray-500/50";
        return "from-orange-400 to-orange-600 border-orange-300 shadow-orange-500/50";
    };

    const getPlaceText = (rank: number) => {
        if (rank === 1) return "1st Place";
        if (rank === 2) return "2nd Place";
        if (rank === 3) return "3rd Place";
        return `${rank}th Place`;
    };

    // --- START PAGE RENDER ---
    if (!hasStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
                style={{
                    background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
                }}
            >
                {/* Background Pattern/Vectors */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* We can reproduce the 'burst' effect or scattered stars using mapped items */}
                    {[...Array(12)].map((_, i) => (
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

                {/* Top Branding Tag / Logo Container */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] h-[320px] bg-white rounded-b-[30px] shadow-lg flex items-center justify-center z-20">
                    <div className="text-center pt-16">
                        {/* Placeholder for SLT-MOBITEL logo. Using a relevant placeholder or text if image missing */}
                        <img
                            src="/slt-logo.png"
                            alt="SLT Mobitel"
                            className="w-48 mx-auto"
                        />
                    </div>
                </div>

                <div className="text-center z-30 px-8 mt-48">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="font-bold text-white mb-4 drop-shadow-xl"
                        style={{ fontSize: "72px", lineHeight: "72px", fontFamily: "Arial, sans-serif" }}
                    >
                        {eventName}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-white mb-16 drop-shadow-md"
                        style={{ fontSize: "30px", fontFamily: "Arial, sans-serif" }}
                    >
                        Grand Raffle Draw
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setHasStarted(true);
                            setTimeout(() => handleStartDraw(), 500);
                        }}
                        className="px-16 py-6 text-white font-bold shadow-2xl transition-all duration-300"
                        style={{
                            background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                            borderRadius: "100px",
                            fontSize: "30px",
                            fontFamily: "Arial, sans-serif",
                            boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }}
                    >
                        START DRAW
                    </motion.button>
                </div>
            </div>
        );
    }

    // --- COMPLETION PAGE RENDER ---
    if (isCompleted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                    background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
                }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(15)].map((_, i) => (
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

                {/* Top Branding Tag / Logo Container */}
                <motion.div
                    initial={{ y: -300 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 bg-white flex items-center justify-center z-20 shadow-xl"
                    style={{
                        width: "359px",
                        height: "330px",
                        borderRadius: "0px 0px 30px 30px",
                        top: "-80px" // Adjusted to hang as per design
                    }}
                >
                    <div className="mt-40">
                        {/* Using the same logo path as Start Page */}
                        <img
                            src="/slt-logo.png"
                            alt="SLT Mobitel"
                            className="w-64 mx-auto"
                        />
                    </div>
                </motion.div>

                <div className="z-10 text-center mt-32 flex flex-col items-center">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white font-bold mb-4 drop-shadow-xl"
                        style={{
                            fontFamily: "Arial, sans-serif",
                            fontSize: "96px",
                            lineHeight: "96px"
                        }}
                    >
                        Congratulations!
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-white mb-24 drop-shadow-md"
                        style={{
                            fontFamily: "Arial, sans-serif",
                            fontSize: "36px",
                            lineHeight: "40px"
                        }}
                    >
                        Thank you to all participants!
                    </motion.p>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className="bg-white font-bold transition-transform flex items-center justify-center cursor-pointer"
                        style={{
                            width: "228px",
                            height: "84px",
                            borderRadius: "100px",
                            color: "#009689",
                            fontSize: "30px",
                            fontFamily: "Arial, sans-serif",
                            boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }}
                    >
                        Restart
                    </motion.button>
                </div>
            </div>
        );
    }

    if (!currentPrize && !isCompleted) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-white/50">No Prizes Available</h1>
            </div>
        );
    }

    // --- MAIN DRAW PAGE RENDER ---
    return (
        <div className="min-h-screen flex flex-col items-center relative overflow-hidden p-8"
            style={{
                background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
            }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
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

            <div className="z-10 w-full max-w-7xl flex flex-col h-full">
                {/* Header - Consistent with Start Page */}
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 mt-8"
                >
                    <h1 className="font-bold text-white mb-2 drop-shadow-xl"
                        style={{ fontSize: "64px", lineHeight: "1.1", fontFamily: "Arial, sans-serif" }}
                    >
                        {eventName}
                    </h1>
                    <p className="text-white text-2xl font-normal drop-shadow-md" style={{ fontFamily: "Arial, sans-serif" }}>
                        Grand Raffle Draw
                    </p>
                </motion.div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative min-h-[500px]">

                    {/* Floating Images Layer (Only visible when animating) */}
                    <AnimatePresence>
                        {isAnimating && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {floatingImages.map((floatingImage) => {
                                    const isMagnetized = magnetizedImages.includes(floatingImage.id);
                                    // Wrap index safely
                                    const pIndex = floatingImage.participantIndex % eligibleParticipants.length;
                                    const participant = eligibleParticipants[pIndex];
                                    if (!participant) return null;

                                    return (
                                        <motion.div
                                            key={floatingImage.id}
                                            className="absolute top-1/2 left-1/2"
                                            initial={{ x: floatingImage.x, y: floatingImage.y, scale: floatingImage.scale, rotate: floatingImage.rotation }}
                                            animate={{
                                                x: isMagnetized ? 0 : [floatingImage.x, floatingImage.x + Math.random() * 60 - 30, floatingImage.x],
                                                y: isMagnetized ? 0 : [floatingImage.y, floatingImage.y + Math.random() * 60 - 30, floatingImage.y],
                                                scale: isMagnetized ? 0 : floatingImage.scale,
                                                rotate: isMagnetized ? 720 : [floatingImage.rotation, floatingImage.rotation + 15, floatingImage.rotation - 15, floatingImage.rotation],
                                                opacity: isMagnetized ? 0 : 0.6,
                                            }}
                                            transition={{
                                                duration: isMagnetized ? 0.8 : 3 + Math.random() * 2, // Smoother snap (0.7s)
                                                ease: "easeInOut",
                                            }}
                                        >
                                            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-1 shadow-lg w-16 h-16 overflow-hidden">
                                                <img src={getImageUrl(participant.photoUrl) || `https://ui-avatars.com/api/?name=${participant.name}`}
                                                    alt="p" className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Central Magnet / Winner Reveal */}
                    <div className="relative z-20">
                        {isAnimating ? (
                            <div className="relative">
                                {/* Magnetic Rings */}
                                {[1, 2, 3].map((ring) => (
                                    <motion.div key={ring} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-400/30"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: ring * 0.5, ease: "easeOut" }}
                                        style={{ width: `${300 + ring * 60}px`, height: `${300 + ring * 60}px` }}
                                    />
                                ))}

                                {/* Central Shuffling Card */}
                                <motion.div animate={{ boxShadow: ["0 0 30px rgba(250, 204, 21, 0.5)", "0 0 60px rgba(250, 204, 21, 0.8)", "0 0 30px rgba(250, 204, 21, 0.5)"] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="relative bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-3xl p-6 shadow-2xl">

                                    {/* Sparkles around magnet */}
                                    {[0, 1, 2, 3].map((sparkle) => (
                                        <motion.div key={sparkle} className="absolute"
                                            style={{
                                                top: sparkle === 0 ? "-20px" : sparkle === 1 ? "50%" : sparkle === 2 ? "calc(100% + 20px)" : "50%",
                                                left: sparkle === 0 ? "50%" : sparkle === 1 ? "-20px" : sparkle === 2 ? "50%" : "calc(100% + 20px)",
                                                transform: "translate(-50%, -50%)",
                                            }}
                                            animate={{ scale: [1, 1.5, 1], rotate: [0, 180, 360] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: sparkle * 0.25 }}
                                        >
                                            <Sparkles className="w-10 h-10 text-white fill-white drop-shadow-lg" />
                                        </motion.div>
                                    ))}

                                    <div className="w-64 h-64 bg-white/20 rounded-2xl backdrop-blur-sm border-4 border-white shadow-inner overflow-hidden relative">
                                        {eligibleParticipants.length > 0 && (
                                            <motion.div
                                                key={selectedIndex}
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                className="w-full h-full relative"
                                            >
                                                <img src={getImageUrl(eligibleParticipants[selectedIndex % eligibleParticipants.length]?.photoUrl) || ""}
                                                    alt="shuffle" className="w-full h-full object-cover" />
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-white font-bold truncate">
                                                    {eligibleParticipants[selectedIndex % eligibleParticipants.length]?.name || "..."}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1, repeat: Infinity }}
                                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-3 shadow-xl">
                                        <Trophy className="w-8 h-8 text-white" />
                                    </motion.div>
                                </motion.div>
                            </div>
                        ) : winner ? (
                            /* WINNER REVEAL UI */
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="z-50 flex items-center justify-center pointer-events-auto"
                                >
                                    {/* Winner Card Container */}
                                    <div
                                        className="bg-white relative flex flex-col items-center"
                                        style={{
                                            width: "1152px",
                                            height: "536px",
                                            maxWidth: "90vw",
                                            borderRadius: "24px",
                                            boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                                        }}
                                    >
                                        {/* Rank Badge */}
                                        <div
                                            className="absolute flex items-center justify-center gap-3 px-12 py-4 rounded-full"
                                            style={{
                                                top: "48px",
                                                height: "72px",
                                                background: "linear-gradient(90deg, #FF8904 0%, #F54900 100%)",
                                                boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)"
                                            }}
                                        >
                                            <Trophy className="text-white w-10 h-10" />
                                            <span
                                                className="text-white font-bold"
                                                style={{
                                                    fontSize: "36px",
                                                    fontFamily: "Arial, sans-serif"
                                                }}
                                            >
                                                {getPlaceText(currentPrize.rank)}
                                            </span>
                                        </div>

                                        {/* Content Container (Winner + Prize) */}
                                        <div
                                            className="absolute flex items-center justify-center gap-16"
                                            style={{
                                                top: "173px",
                                                width: "100%",
                                                padding: "0 48px"
                                            }}
                                        >
                                            {/* Winner Section */}
                                            <div className="flex flex-col items-center gap-6">
                                                {/* Winner Photo Container */}
                                                <div className="relative" style={{ width: "216px", height: "192px" }}>
                                                    {/* Glow Effect */}
                                                    <div
                                                        className="absolute rounded-full"
                                                        style={{
                                                            width: "217px",
                                                            height: "213px",
                                                            left: "-53px",
                                                            top: "-53px",
                                                            background: "linear-gradient(112.06deg, #51B749 24.61%, #01B4EC 81.46%)",
                                                            opacity: 0.2,
                                                            filter: "blur(16px)",
                                                            transform: "rotate(34.18deg)"
                                                        }}
                                                    />
                                                    {/* Winner Image */}
                                                    <div
                                                        className="absolute rounded-full overflow-hidden bg-white"
                                                        style={{
                                                            width: "192px",
                                                            height: "192px",
                                                            border: "8px solid #FFFFFF",
                                                            boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                                                        }}
                                                    >
                                                        <img
                                                            src={getImageUrl(winner.photoUrl) || `https://ui-avatars.com/api/?name=${winner.name}`}
                                                            alt={winner.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-center" style={{ width: "216px" }}>
                                                    <h3
                                                        className="font-bold text-[#1E2939]"
                                                        style={{
                                                            fontSize: "36px",
                                                            lineHeight: "40px",
                                                            fontFamily: "Arial, sans-serif"
                                                        }}
                                                    >
                                                        {winner.name}
                                                    </h3>
                                                    <p
                                                        className="text-[#4A5565] mt-2"
                                                        style={{
                                                            fontSize: "24px",
                                                            fontFamily: "Arial, sans-serif"
                                                        }}
                                                    >
                                                        Winner!
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Prize Section */}
                                            <div className="flex flex-col items-center gap-6">
                                                {/* Prize Image Container */}
                                                <div className="relative" style={{ width: "192px", height: "192px" }}>
                                                    {/* Glow Effect */}
                                                    <div
                                                        className="absolute"
                                                        style={{
                                                            width: "192px",
                                                            height: "194px",
                                                            background: "linear-gradient(112.06deg, #51B749 24.61%, #01B4EC 81.46%)",
                                                            opacity: 0.4,
                                                            filter: "blur(16px)"
                                                        }}
                                                    />

                                                    {/* Gift Icon Overlay */}
                                                    <Gift
                                                        className="absolute z-20"
                                                        style={{
                                                            width: "57px",
                                                            height: "57px",
                                                            left: "140px",
                                                            top: "-16px",
                                                            color: "#F6339A",
                                                            transform: "rotate(-12deg)"
                                                        }}
                                                    />

                                                    {/* Prize Image */}
                                                    <div
                                                        className="absolute rounded-2xl overflow-hidden bg-white flex items-center justify-center"
                                                        style={{
                                                            width: "192px",
                                                            height: "192px",
                                                            border: "4px solid #FCCEE8",
                                                            boxShadow: "0px 25px 50px -12px rgba(25, 50, 211, 0.25)",
                                                            borderRadius: "16px"
                                                        }}
                                                    >
                                                        <img
                                                            src={getImageUrl(currentPrize.imageUrl)}
                                                            alt={currentPrize.name}
                                                            className="w-full h-full object-contain p-4"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-center" style={{ width: "192px" }}>
                                                    <h3
                                                        className="font-bold text-[#1E2939]"
                                                        style={{
                                                            fontSize: "30px",
                                                            lineHeight: "36px",
                                                            fontFamily: "Arial, sans-serif"
                                                        }}
                                                    >
                                                        {currentPrize.name}
                                                    </h3>
                                                    <p
                                                        className="text-[#4A5565] mt-2"
                                                        style={{
                                                            fontSize: "20px",
                                                            fontFamily: "Arial, sans-serif"
                                                        }}
                                                    >
                                                        Prize
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="absolute" style={{ top: "852px" }}>
                                            {/* Note: In user design top is 852px which is outside 536px container relative to full page 
                                                But here we want it relative to the container or just below it. 
                                                The user design screenshot shows the button clearly separate below.
                                                Let's place it outside this white container relative to the screen center 
                                                OR append it at the bottom with spacing. 
                                                Wait, looking at the user image, the "Next Draw" button is OUTSIDE the white card.
                                            */}
                                        </div>
                                    </div>

                                    {/* Action Button - Outside the white card */}
                                    <div className="absolute" style={{ top: "calc(50% + 268px + 40px)" }}>
                                        {/* 536px/2 = 268px + spacing */}
                                        {currentPrizeIndex >= sortedPrizes.length - 1 ? (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setIsCompleted(true)}
                                                className="text-white font-bold rounded-full uppercase flex items-center justify-center"
                                                style={{
                                                    width: "338px",
                                                    height: "84px",
                                                    background: "linear-gradient(90deg, #00C853 0%, #64DD17 100%)",
                                                    fontSize: "30px",
                                                    fontFamily: "Arial, sans-serif",
                                                    boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                                                }}
                                            >
                                                DONE
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleNextPrize}
                                                className="text-white font-bold rounded-full uppercase flex items-center justify-center"
                                                style={{
                                                    width: "338px",
                                                    height: "84px",
                                                    background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                                    fontSize: "30px",
                                                    fontFamily: "Arial, sans-serif",
                                                    boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                                                }}
                                            >
                                                NEXT DRAW
                                            </motion.button>
                                        )}
                                    </div>

                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            /* IDLE STATE: MAGNET PLACEHOLDER STATIC or START BUTTON AREA */
                            <div className="text-center mt-12">
                                <p className="text-white/80 text-xl mb-8">Ready to draw winner for <span className="text-yellow-400 font-bold">{getPlaceText(currentPrize.rank)}</span></p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-32 flex items-center justify-center">
                    {!winner && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStartDraw}
                            disabled={isAnimating}
                            className="px-16 py-5 text-2xl font-bold rounded-full text-white shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                boxShadow: "0px 10px 30px rgba(253, 199, 0, 0.3)"
                            }}
                        >
                            {isAnimating ? "SPINNING..." : "START SPIN"}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
