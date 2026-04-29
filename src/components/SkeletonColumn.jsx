import React from "react";
import SkeletonTaskCard from "./SkeletonTaskCard";

const SkeletonColumn = () => {
    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-24 skeleton skeleton-shimmer" />
                    <div className="h-6 w-6 skeleton skeleton-shimmer rounded-full" />
                </div>
                <div className="h-6 w-6 skeleton skeleton-shimmer rounded-md" />
            </div>

            <div className="flex-1 bg-muted/40 dark:bg-white/[0.02] rounded-3xl p-3 border border-dashed border-border/60 min-h-[500px]">
                <SkeletonTaskCard />
                <SkeletonTaskCard />
                <SkeletonTaskCard />
            </div>
        </div>
    );
};

export default SkeletonColumn;
