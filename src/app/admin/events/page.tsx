"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Event } from "@/types";
import { Plus, X, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data } = await api.get('/events');
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/events', { title, date });
            setIsCreateModalOpen(false);
            setTitle("");
            setDate("");
            fetchEvents();
        } catch (error) {
            console.error("Failed to create event", error);
            alert("Failed to create event");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>Event Management</h1>
                    <p className="text-gray-500 mt-1">Manage your raffle events and prizes</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 text-white rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105"
                    style={{
                        background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                        fontWeight: "bold"
                    }}
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </button>
            </div>

            <div className="grid gap-4">
                {events.map(event => (
                    <Link
                        key={event.id}
                        href={`/admin/events/${event.id}`}
                        className="block bg-gray-50 rounded-xl p-6 hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 group"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{event.title}</h3>
                                <div className="flex items-center gap-4 text-gray-500 text-sm">
                                    <span className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        {new Date(event.date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm font-mono text-xs border border-gray-100">
                                        KEY: <span className="font-bold text-gray-700">{event.enrollmentKey}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Create Event Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-800">Create New Event</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateEvent} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        placeholder="e.g., Q3 Town Hall"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full text-white font-bold py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                                        style={{
                                            background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                        }}
                                    >
                                        Create Event
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
