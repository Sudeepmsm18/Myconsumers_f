import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Mail, Shield, Award, User } from "lucide-react";

const ProjectMembersModal = ({ isOpen, onClose, members, creator, isDarkMode }) => {
    if (!members) return null;

    // Sort: Creator (Lead) first, then others
    const sortedMembers = [...members].sort((a, b) => {
        const aIsCreator = String(a.id) === String(creator?.id || creator?.userId) || a.name === creator;
        const bIsCreator = String(b.id) === String(creator?.id || creator?.userId) || b.name === creator;
        if (aIsCreator) return -1;
        if (bIsCreator) return 1;
        return 0;
    });

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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-lg border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-[110] ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'}`}
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Team Members</h2>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                        {members.length} Professional{members.length !== 1 ? 's' : ''} assigned
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-foreground transition-all active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Members List */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid gap-4">
                                {sortedMembers.map((member, index) => {
                                    const isLead = String(member.id) === String(creator?.id || creator?.userId) || member.name === creator;
                                    const avatarUrl = `/domo/avatars/v2/USER/${member.id}`;

                                    return (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`p-4 rounded-[1.5rem] border border-white/5 flex items-center justify-between group hover:bg-primary/5 transition-all ${isLead ? 'bg-primary/[0.03] border-primary/20' : 'bg-muted/10'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-card transition-transform group-hover:scale-110 ${isLead ? 'border-primary' : 'border-white/10'}`}>
                                                        <img
                                                            src={avatarUrl}
                                                            alt={member.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&bold=true`;
                                                            }}
                                                        />
                                                    </div>
                                                    {isLead && (
                                                        <div className="absolute -top-2 -left-2 p-1 bg-primary text-white rounded-lg shadow-lg">
                                                            <Award size={12} fill="currentColor" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-lg">{member.name}</span>
                                                        {isLead && (
                                                            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                                Lead
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground/60 font-medium">{member.email || 'No email provided'}</span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-all">
                                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                                    <User size={16} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-white/5 bg-primary/5 flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-foreground text-background font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProjectMembersModal;
