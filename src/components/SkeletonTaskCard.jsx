import React from "react";

const SkeletonTaskCard = () => {
    return (
        <div className="glass-card p-4 rounded-2xl shadow-sm border border-white/40 dark:border-white/5 mb-4 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
                <div className="h-5 w-3/4 skeleton skeleton-shimmer" />
                <div className="h-6 w-6 skeleton skeleton-shimmer rounded-lg" />
            </div>

            <div className="space-y-2 mb-4">
                <div className="h-3 w-full skeleton skeleton-shimmer" />
                <div className="h-3 w-5/6 skeleton skeleton-shimmer" />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                <div className="h-6 w-24 skeleton skeleton-shimmer rounded-lg" />
                <div className="h-6 w-16 skeleton skeleton-shimmer rounded-lg" />
            </div>

            <div className="w-full mt-3 pt-3 border-t border-white/5">
                <div className="h-3 w-20 skeleton skeleton-shimmer" />
            </div>

            <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full" />
        </div>
    );
};

export default SkeletonTaskCard;
