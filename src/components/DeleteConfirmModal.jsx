import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2 } from "lucide-react";

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, taskTitle }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-2">
                                    <AlertTriangle size={32} />
                                </div>

                                <h2 className="text-2xl font-bold text-foreground">Delete Task?</h2>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Are you sure you want to delete <span className="text-foreground font-bold">"{taskTitle}"</span>?
                                    This action cannot be undone.
                                </p>

                                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                    <button
                                        onClick={onClose}
                                        className="p-3.5 rounded-2xl border border-border font-bold hover:bg-muted transition-colors text-muted-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className="bg-red-500 text-white p-3.5 rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmModal;
