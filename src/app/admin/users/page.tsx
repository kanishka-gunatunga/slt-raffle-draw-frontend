"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User } from "@/types";
import { Plus, QrCode, Trash2, X, Search, Download } from "lucide-react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewQrUser, setViewQrUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('location', location);
        if (photo) formData.append('photo', photo);

        try {
            await api.post('/users', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsAddModalOpen(false);
            setName("");
            setLocation("");
            setPhoto(null);
            fetchUsers();
        } catch (error) {
            console.error("Failed to create user", error);
            alert("Failed to create user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm("Are you sure? This will remove them from all events.")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Failed to delete user");
        }
    }

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 shrink-0 border-b border-gray-100/50">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>User Management</h1>
                        <p className="text-gray-500 mt-1">Manage system administrators and participants</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-3 border border-gray-200 rounded-full w-full md:w-64 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105"
                            style={{
                                background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                fontWeight: "bold"
                            }}
                        >
                            <Plus className="w-5 h-5" />
                            Add Manager
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
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div key={user.id} className="bg-gray-50 rounded-2xl p-4 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 group relative">
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 mb-4 shadow-inner">
                                        <img
                                            src={getImageUrl(user.photoUrl) || `https://ui-avatars.com/api/?name=${user.name}`}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="px-1">
                                        <h3 className="font-bold text-lg text-gray-900 truncate">{user.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                            {user.location || "No Location"}
                                        </p>
                                        <button
                                            onClick={() => setViewQrUser(user)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-semibold text-sm"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            View QR Code
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No users found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-800">Add New Manager</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Location</label>
                                    <input
                                        type="text"
                                        required
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        placeholder="Enter location"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Photo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setPhoto(e.target.files?.[0] || null)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                                                Creating User...
                                            </>
                                        ) : "Create User"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View QR Modal */}
            <AnimatePresence>
                {viewQrUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center border border-gray-100"
                        >
                            <div className="p-8 relative">
                                <button
                                    onClick={() => setViewQrUser(null)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-bold mb-2 text-gray-900">{viewQrUser.name}</h2>
                                <p className="text-gray-500 mb-8">Scan to mark attendance</p>
                                <div className="flex justify-center p-4 bg-white rounded-xl shadow-inner border border-gray-100 mx-auto w-fit" id="qr-code-container">
                                    <QRCode
                                        value={viewQrUser.id.toString()}
                                        id={`qr-code-${viewQrUser.id}`}
                                    />
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (!viewQrUser) return;
                                            const svg = document.getElementById(`qr-code-${viewQrUser.id}`);
                                            if (!svg) return;

                                            const svgData = new XMLSerializer().serializeToString(svg);
                                            const canvas = document.createElement("canvas");
                                            const ctx = canvas.getContext("2d");
                                            const img = new Image();

                                            img.onload = () => {
                                                // High resolution for clear printing/scanning
                                                const size = 1024;
                                                canvas.width = size;
                                                canvas.height = size;

                                                if (ctx) {
                                                    // Fill white background (transparent QRs can fail on dark themes/paper)
                                                    ctx.fillStyle = "#FFFFFF";
                                                    ctx.fillRect(0, 0, size, size);

                                                    // Draw image scaled to canvas size
                                                    // Add a small padding (50px) to ensure quiet zone
                                                    const padding = 50;
                                                    ctx.drawImage(img, padding, padding, size - (padding * 2), size - (padding * 2));
                                                }

                                                const pngFile = canvas.toDataURL("image/png");
                                                const downloadLink = document.createElement("a");
                                                downloadLink.download = `QR-${viewQrUser.name.replace(/\s+/g, '-')}.png`;
                                                downloadLink.href = pngFile;
                                                downloadLink.click();
                                            };

                                            img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download PNG
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-4 font-mono">User ID: {viewQrUser.id}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
