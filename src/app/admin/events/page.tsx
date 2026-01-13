"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Event } from "@/types";
import { Plus, Clock, Calendar, ArrowRight, Trash2, X, Search } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/events');
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/events', { title, date });
            setIsAddModalOpen(false);
            setTitle("");
            setDate("");
            fetchEvents();
        } catch (error) {
            console.error("Failed to create event", error);
            alert("Failed to create event");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        if (!confirm("Are you sure? This will remove all associated data.")) return;
        try {
            await api.delete(`/events/${id}`);
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert("Failed to delete event");
        }
    }

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 shrink-0 border-b border-gray-100/50">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>Event Management</h1>
                        <p className="text-gray-500 mt-1">Manage raffle draw events</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-3 border border-gray-200 rounded-full w-full md:w-64 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105 shrink-0"
                            style={{
                                background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                fontWeight: "bold"
                            }}
                        >
                            <Plus className="w-5 h-5" />
                            Create Event
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map(event => (
                                <Link href={`/admin/events/${event.id}`} key={event.id} className="block group">
                                    <div className="bg-white rounded-2xl p-6 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-xl h-full relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-blue-100/50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                                    <Calendar className="w-8 h-8" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${event.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                        event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                                                            event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {event.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1" title={event.title}>
                                                {event.title}
                                            </h3>

                                            <div className="space-y-2 text-sm text-gray-500 mb-6">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(event.date).toLocaleDateString(undefined, {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                {/* <div className="flex items-center gap-2">
                                                     <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                        KEY: {event.enrollmentKey}
                                                     </span>
                                                </div> */}
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <span className="text-sm font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    View Details <ArrowRight className="w-4 h-4" />
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleDeleteEvent(event.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-20"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No events found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setIsAddModalOpen(false)}
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
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        placeholder="e.g. Annual Gala 2024"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full text-white font-bold py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                        style={{
                                            background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <LoadingSpinner size="sm" className="text-white" />
                                                Creating Event...
                                            </>
                                        ) : "Create Event"}
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
