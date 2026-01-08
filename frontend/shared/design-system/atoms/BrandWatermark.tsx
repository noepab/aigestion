import React from 'react';
import { motion } from 'framer-motion';

export const BrandWatermark: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.03 }}
                className="w-[80vw] h-[80vw] max-h-[800px] max-w-[800px] rounded-full border-[100px] border-white blur-[100px]"
            />
            <div className="absolute bottom-8 right-8 z-0">
                <h1 className="text-[120px] font-black text-white/5 leading-none select-none tracking-tighter">
                    AI GESTION<br/>NEXT
                </h1>
            </div>
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px]" />
        </div>
    );
};
