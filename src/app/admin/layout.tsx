"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Calendar, LogOut, LayoutDashboard, FileText } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const isLoginPage = pathname === '/admin/login';

        if (!token && !isLoginPage) {
            router.push('/admin/login');
        } else if (token && isLoginPage) {
            router.push('/admin/users');
        }
        setIsLoading(false);
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
    };

    const isActive = (path: string) => pathname.startsWith(path);
    const isLoginPage = pathname === '/admin/login';

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (isLoginPage) {
        return <div className="min-h-screen">{children}</div>;
    }

    const sidebarContent = (
        <>
            <div className="p-6 border-b border-white/10 shrink-0">
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                    <LayoutDashboard className="w-8 h-8 text-yellow-500" />
                    Admin
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto w-full">
                <Link
                    href="/admin/users"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/admin/users') ? 'bg-white/20 text-white shadow-lg border border-white/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                    <Users className="w-5 h-5" />
                    Users
                </Link>
                <Link
                    href="/admin/events"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/admin/events') ? 'bg-white/20 text-white shadow-lg border border-white/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                    <Calendar className="w-5 h-5" />
                    Events
                </Link>
                <Link
                    href="/admin/reports"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/admin/reports') ? 'bg-white/20 text-white shadow-lg border border-white/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                    <FileText className="w-5 h-5" />
                    Reports
                </Link>
            </nav>

            <div className="p-4 border-t border-white/10 shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-200 hover:bg-red-500/20 hover:text-red-100 w-full rounded-xl transition-all duration-200 font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="h-screen w-full flex overflow-hidden fixed inset-0"
            style={{
                background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
            }}
        >
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 text-white hidden md:flex flex-col h-full shrink-0">
                {sidebarContent}
            </aside>

            {/* Mobile Header & Menu */}
            <div className={`md:hidden fixed inset-0 z-50 ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Mobile Sidebar Panel */}
                <div className={`absolute top-0 left-0 w-64 h-full bg-[#1a2b6d] text-white flex flex-col shadow-2xl transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebarContent}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-hidden flex flex-col relative">
                {/* Mobile Menu Button - Only visible on mobile */}
                <div className="md:hidden p-4 flex items-center justify-between text-white shrink-0">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <LayoutDashboard className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg">Admin Panel</span>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                <div className="flex-1 overflow-hidden p-4 md:p-8 pt-0 md:pt-8">
                    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl h-full border border-white/20 overflow-hidden flex flex-col">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
