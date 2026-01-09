"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Calendar, LogOut, LayoutDashboard } from "lucide-react";

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

    if (isLoginPage) {
        return <div className="min-h-screen">{children}</div>;
    }

    return (
        <div className="h-screen w-full flex overflow-hidden fixed inset-0"
            style={{
                background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
            }}
        >
            {/* Sidebar */}
            <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 text-white flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-white/10 shrink-0">
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                        <LayoutDashboard className="w-8 h-8 text-yellow-500" />
                        Admin
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl min-h-full border border-white/20 overflow-hidden flex flex-col">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
