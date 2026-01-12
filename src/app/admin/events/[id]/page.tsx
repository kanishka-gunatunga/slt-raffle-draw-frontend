"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Event, User } from "@/types";
import { QrCode, UserPlus, Check, X, Gift as GiftIcon, Trash2, Calendar, Trophy, FileText, Download } from "lucide-react";
import QrScannerModal from "@/components/QrScannerModal";
import Link from 'next/link';
import { getImageUrl } from "@/lib/utils";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function EventDetailsPage() {
    const { id: eventId } = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [participants, setParticipants] = useState<User[]>([]); // Users engaged in event

    // UI States
    const [scanning, setScanning] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

    // PDF Generation
    const generatePDF = () => {
        if (!event || !event.winners) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Raffle Draw Results", 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`Event: ${event.title}`, 14, 32);
        doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 14, 38);

        // Table
        const tableBody = event.winners
            .sort((a, b) => a.gift.rank - b.gift.rank)
            .map(w => [
                `#${w.gift.rank}`,
                w.gift.name,
                w.user.name,
                w.user.location || '-',
                new Date(w.wonAt).toLocaleTimeString()
            ]);

        autoTable(doc, {
            head: [['Rank', 'Prize', 'Winner Name', 'Location', 'Time']],
            body: tableBody,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] },
            styles: { fontSize: 10, cellPadding: 3 },
        });

        doc.save(`Raffle-Results-${event.title.replace(/\s+/g, '-')}.pdf`);
    };

    // Forms
    const [giftForm, setGiftForm] = useState({ name: '', imageUrl: '', rank: '1' });
    const [isGiftSubmitting, setIsGiftSubmitting] = useState(false);

    // Participant Selection
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [isAddingParticipants, setIsAddingParticipants] = useState(false);

    useEffect(() => {
        fetchEventDetails();
        fetchUsers();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const { data } = await api.get(`/events/${eventId}`);
            setEvent(data);

            // Extract participants from attendance
            // Assuming backend returns attendances included
            if (data.attendances) {
                const participantList: User[] = data.attendances.map((a: any) => ({
                    ...a.user,
                    status: a.status // Attach attendance status
                }));
                setParticipants(participantList);
            }
        } catch (error) {
            console.error("Error fetching event", error);
        }
    };

    const fetchUsers = async () => {
        const { data } = await api.get('/users');
        setAllUsers(data);
    }

    const availableUsers = allUsers.filter(u => !participants.some(p => p.id === u.id));

    const handleAddGift = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGiftSubmitting(true);
        try {
            await api.post(`/events/${eventId}/gifts`, giftForm);
            setGiftForm({ name: '', imageUrl: '', rank: '1' });
            fetchEventDetails();
        } catch (error) {
            console.error(error);
            alert("Failed to add gift");
        } finally {
            setIsGiftSubmitting(false);
        }
    };

    const handleAddParticipants = async () => {
        setIsAddingParticipants(true);
        try {
            await api.post(`/events/${eventId}/participants`, {
                userIds: Array.from(selectedUserIds)
            });
            setIsAddModalOpen(false);
            setSelectedUserIds(new Set());
            fetchEventDetails(); // Refresh list
        } catch (error) {
            console.error(error);
            alert("Failed to add participants");
        } finally {
            setIsAddingParticipants(false);
        }
    }

    const toggleAttendance = async (userId: number, isPresent: boolean) => {
        if (isPresent) {
            try {
                // Determine current status? Logic mainly toggles TO present
                await api.post('/attendance/mark', { eventId, userId });
                fetchEventDetails(); // Reload to update status in UI
            } catch (error) {
                console.error(error);
                alert("Failed to mark attendance");
            }
        } else {
            alert("Cannot unmark attendance yet.");
        }
    };

    const handleDeleteGift = async (giftId: number) => {
        if (!confirm("Are you sure you want to delete this prize?")) return;
        try {
            await api.delete(`/events/${eventId}/gifts/${giftId}`);
            fetchEventDetails();
        } catch (error) {
            console.error(error);
            alert("Failed to delete prize");
        }
    };

    // Scanning Logic
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [lastScanned, setLastScanned] = useState<string | null>(null);

    const handleScan = async (scannedId: string | null) => {
        if (!scannedId) return;
        if (scanFeedback?.type === 'info') return; // Ignore while processing
        if (scannedId === lastScanned) return; // Debounce immediate re-scans

        setLastScanned(scannedId);

        const userId = parseInt(scannedId);
        if (isNaN(userId)) {
            setScanFeedback({ type: 'error', message: 'Invalid QR Code' });
            setTimeout(() => { setScanFeedback(null); setLastScanned(null); }, 2000);
            return;
        }

        setScanning(true);
        setScanFeedback({ type: 'info', message: 'Processing...' });

        try {
            await api.post('/attendance/mark', { eventId, userId });
            await fetchEventDetails();

            // Find user name for better feedback
            const user = allUsers.find(u => u.id === userId);
            setScanFeedback({ type: 'success', message: `${user?.name || 'User'} marked Present!` });

            // Reset for next scan - shorter duration
            setTimeout(() => {
                setScanFeedback(null);
                setLastScanned(null);
            }, 1200);

        } catch (error) {
            console.error(error);
            setScanFeedback({ type: 'error', message: 'Failed to mark attendance' });
            setTimeout(() => {
                setScanFeedback(null);
                setLastScanned(null);
            }, 2000);
        }
    };

    if (!event) return <div className="h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

    const giftsByRank = (rank: number) => event.gifts?.find(g => g.rank === rank);

    return (
        <div className="h-full flex flex-col p-6">
            <header className="shrink-0 mb-8 border-b border-gray-100 pb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Arial, sans-serif" }}>{event.title}</h1>
                    <div className="flex items-center gap-4 text-gray-500">
                        <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString()}</p>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <p className="font-mono bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm border border-blue-100">KEY: <strong>{event.enrollmentKey}</strong></p>
                    </div>
                </div>
                <Link href={`/events/${event.id}/raffle`} target="_blank"
                    className="px-6 py-3 bg-white text-blue-600 rounded-full font-bold hover:bg-blue-50 border border-blue-200 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                >
                    Launch Raffle Page &rarr;
                </Link>
            </header>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:overflow-hidden overflow-y-auto lg:overflow-y-visible">
                {/* LEFT COLUMN: CONFIG & RESULTS */}
                <div className="flex flex-col gap-8 lg:h-full lg:overflow-y-auto pr-2 custom-scrollbar">
                    {/* GIFTS MANAGEMENT */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                                Prize Configuration
                            </h2>
                            <button
                                onClick={() => setIsGiftModalOpen(true)}
                                className="text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm font-bold"
                                style={{
                                    background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                }}
                            >
                                <GiftIcon className="w-4 h-4" />
                                Add Prize
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(event.gifts && event.gifts.length > 0) ? (
                                event.gifts.sort((a, b) => a.rank - b.rank).map((gift) => (
                                    <div key={gift.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-colors">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md ${gift.rank === 1 ? 'bg-yellow-400' :
                                            gift.rank === 2 ? 'bg-gray-400' :
                                                gift.rank === 3 ? 'bg-orange-400' : 'bg-slate-400'
                                            }`}>
                                            #{gift.rank}
                                        </div>
                                        <div className="flex-1 flex gap-4 items-center">
                                            <div className="w-16 h-16 rounded-xl bg-white p-1 border border-gray-100 shadow-sm overflow-hidden">
                                                <img src={getImageUrl(gift.imageUrl)} className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-gray-900">{gift.name}</p>
                                                {/* <p className="text-xs text-gray-400">ID: {gift.id}</p> */}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGift(gift.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all"
                                            title="Delete Prize"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                                    <GiftIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No prizes configured yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                    {/* RAFFLE RESULTS */}
                    <section className="flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                                Raffle Results
                            </h2>
                            <button
                                onClick={generatePDF}
                                disabled={!event?.winners?.length}
                                className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
                            >
                                <FileText className="w-4 h-4" />
                                Report
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            {(event.winners && event.winners.length > 0) ? (
                                <div className="space-y-4">
                                    {event.winners
                                        .sort((a, b) => a.gift.rank - b.gift.rank)
                                        .slice(0, 3)
                                        .map((winner) => (
                                            <div key={winner.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${winner.gift.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                                    winner.gift.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                        winner.gift.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-slate-400'
                                                    }`}>
                                                    #{winner.gift.rank}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{winner.user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                        <GiftIcon className="w-3 h-3" /> {winner.gift.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-mono text-gray-400">{new Date(winner.wonAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        ))}

                                    {event.winners.length > 3 && (
                                        <button
                                            onClick={() => setIsResultsModalOpen(true)}
                                            className="w-full py-3 text-center text-blue-600 font-bold text-sm hover:bg-blue-50 rounded-xl transition-colors border border-blue-100 border-dashed"
                                        >
                                            View All {event.winners.length} Winners
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-8 text-gray-400">
                                    <Trophy className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm">No winners drawn yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN: PARTICIPATION (ATTENDANCE) */}
                <section className="lg:h-full flex flex-col min-h-[500px] lg:min-h-0">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                            Participation
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm font-bold"
                                style={{
                                    background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                }}
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Users
                            </button>
                            <button
                                onClick={() => setScanning(true)}
                                className="bg-gray-800 text-white px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-black shadow-md transition-all"
                            >
                                <QrCode className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl border border-gray-200 flex-1 min-h-0 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto p-2 flex-1 space-y-2 custom-scrollbar pr-2">
                            {participants.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <UserPlus className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No participants invited yet.</p>
                                </div>
                            ) : (
                                participants.map((user: any) => {
                                    const isPresent = user.status === 'PRESENT';
                                    return (
                                        <div key={user.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isPresent ? 'bg-white border-green-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm">
                                                    <img
                                                        src={getImageUrl(user.photoUrl) || `https://ui-avatars.com/api/?name=${user.name}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                                                    <p className={`text-xs font-medium ${isPresent ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {user.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleAttendance(user.id, !isPresent)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${isPresent ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
                                            >
                                                {isPresent ? 'Present' : 'Mark Present'}
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </section>
            </div>



            {/* ADD PARTICIPANTS MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">Add Participants</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                            {availableUsers.length === 0 ? (
                                <p className="text-center text-gray-500 py-12">All users are already invited.</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => {
                                                if (selectedUserIds.size === availableUsers.length) {
                                                    setSelectedUserIds(new Set());
                                                } else {
                                                    setSelectedUserIds(new Set(availableUsers.map(u => u.id)));
                                                }
                                            }}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                                        >
                                            {selectedUserIds.size === availableUsers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    {availableUsers.map(user => {
                                        const isSelected = selectedUserIds.has(user.id);
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => {
                                                    const next = new Set(selectedUserIds);
                                                    if (isSelected) next.delete(user.id);
                                                    else next.add(user.id);
                                                    setSelectedUserIds(next);
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-gray-50'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    <img
                                                        src={getImageUrl(user.photoUrl) || `https://ui-avatars.com/api/?name=${user.name}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="font-medium text-gray-700">{user.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
                            <span className="font-bold text-gray-600">{selectedUserIds.size} Selected</span>
                            <button
                                onClick={handleAddParticipants}
                                disabled={selectedUserIds.size === 0 || isAddingParticipants}
                                className="text-white px-6 py-2.5 rounded-xl font-bold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                style={{
                                    background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                }}
                            >
                                {isAddingParticipants ? 'Adding...' : 'Add Selected'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GIFT MODAL */}
            {isGiftModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">Add Prize</h2>
                            <button onClick={() => setIsGiftModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={(e) => {
                            handleAddGift(e).then(() => setIsGiftModalOpen(false));
                        }} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Rank/Place</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={giftForm.rank}
                                    onChange={e => setGiftForm({ ...giftForm, rank: e.target.value })}
                                    placeholder="1"
                                />
                                <p className="text-xs text-gray-400 mt-2 ml-1">1 = 1st Place, 2 = 2nd Place, etc.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Gift Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 bg-gray-50 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={giftForm.name}
                                    onChange={e => setGiftForm({ ...giftForm, name: e.target.value })}
                                    placeholder="e.g. Apple Watch Ultra"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Image URL</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 bg-gray-50 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={giftForm.imageUrl}
                                    onChange={e => setGiftForm({ ...giftForm, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    disabled={isGiftSubmitting}
                                    className="w-full text-white font-bold py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                    style={{
                                        background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                    }}
                                >
                                    {isGiftSubmitting ? 'Adding...' : 'Add Gift'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW ALL WINNERS MODAL */}
            {isResultsModalOpen && event && event.winners && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">All Winners</h2>
                            <button onClick={() => setIsResultsModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {event.winners
                                    .sort((a, b) => a.gift.rank - b.gift.rank)
                                    .map((winner) => (
                                        <div key={winner.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl font-bold text-white text-sm shadow-sm ${winner.gift.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                                winner.gift.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                                                    winner.gift.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-slate-400'
                                                }`}>
                                                #{winner.gift.rank} Place
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-50 p-1 border border-gray-100 flex-shrink-0">
                                                    <img src={getImageUrl(winner.gift.imageUrl)} alt={winner.gift.name} className="w-full h-full object-cover rounded" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate">{winner.gift.name}</p>
                                                    <p className="text-xs text-gray-400">Prize</p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-gray-100" />
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-full bg-gray-100 p-0.5 ring-2 ring-offset-2 ring-blue-100 flex-shrink-0">
                                                    <img
                                                        src={getImageUrl(winner.user.photoUrl) || `https://ui-avatars.com/api/?name=${winner.user.name}`}
                                                        alt={winner.user.name}
                                                        className="w-full h-full object-cover rounded-full"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 truncate text-lg">{winner.user.name}</p>
                                                    <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                                        {winner.user.location || "No Location"}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-300 text-center font-mono mt-2">
                                                Won at: {new Date(winner.wonAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {scanning && (
                <QrScannerModal
                    onScan={handleScan}
                    onClose={() => setScanning(false)}
                    feedback={scanFeedback}
                />
            )}
        </div>
    );
}
