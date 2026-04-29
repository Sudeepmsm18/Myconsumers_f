import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Shield } from "lucide-react";

const ProfilePreviewModal = ({ isOpen, onClose, user }) => {
    if (!user) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-card border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-[110]"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr]">
                            {/* Left Side: Avatar Panel */}
                            <div className="p-8 md:p-12 flex flex-col items-center justify-center bg-primary/5 border-r border-white/5">
                                <div className="relative">
                                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 p-1.5 shadow-2xl shadow-primary/20">
                                        <div className="w-full h-full rounded-full bg-card border-4 border-card overflow-hidden flex items-center justify-center">
                                            {user.avatarKey ? (
                                                <img
                                                    src={user.avatarKey}
                                                    alt={user.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-6xl font-black text-primary uppercase">
                                                        {user.displayName?.charAt(0) || "U"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 right-3 w-7 h-7 bg-emerald-500 border-4 border-card rounded-full shadow-lg" />
                                </div>
                            </div>

                            {/* Right Side: Data Panel */}
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black tracking-widest text-primary uppercase w-fit mb-3">
                                        <Shield size={12} />
                                        {user.role || "Team Member"}
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                                        {user.displayName}
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-white/5 group hover:bg-muted/50 transition-all">
                                        <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground group-hover:text-primary transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                                            <span className="text-sm font-semibold text-foreground/90">{user.detail?.email || user.email || "No email provided"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-white/5 group hover:bg-muted/50 transition-all">
                                        <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground group-hover:text-primary transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User Identifier</span>
                                            <span className="text-sm font-semibold text-foreground/90">ID: {user.id || user.userId}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full mt-8 py-3.5 bg-foreground text-background font-bold rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-foreground/10"
                                >
                                    Done Viewing
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfilePreviewModal;
