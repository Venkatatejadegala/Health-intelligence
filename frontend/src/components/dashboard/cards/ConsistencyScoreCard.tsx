import React from 'react';
import { motion } from 'framer-motion';

interface ConsistencyCardProps {
    score: number;
    breakdown: {
        calorieAdherence: number;
        proteinAdherence: number;
        gymAdherence: number;
    };
}

export const ConsistencyScoreCard: React.FC<ConsistencyCardProps> = ({ score, breakdown }) => {
    // Determine color based on score
    const getScoreColor = (val: number) => {
        if (val >= 80) return 'text-[#ccff00]';
        if (val >= 50) return 'text-amber-400';
        return 'text-rose-500';
    };
    const getScoreBg = (val: number) => {
        if (val >= 80) return 'bg-[#ccff00]';
        if (val >= 50) return 'bg-amber-400';
        return 'bg-rose-500';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-850"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                        <span>🎯</span> Consistency Adherence
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Weekly compliance metric</p>
                </div>
                <div className={`text-4xl font-black font-sans ${getScoreColor(score)}`}>
                    {score}%
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-300">Calorie Adherence</span>
                        <span className="font-extrabold text-white">{breakdown.calorieAdherence}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2">
                        <div className={`h-2 rounded-full ${getScoreBg(breakdown.calorieAdherence)}`} style={{ width: `${breakdown.calorieAdherence}%` }}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-300">Protein Target Hit</span>
                        <span className="font-extrabold text-white">{breakdown.proteinAdherence}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2">
                        <div className={`h-2 rounded-full ${getScoreBg(breakdown.proteinAdherence)}`} style={{ width: `${breakdown.proteinAdherence}%` }}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-300">Gym Attendance</span>
                        <span className="font-extrabold text-white">{breakdown.gymAdherence}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2">
                        <div className={`h-2 rounded-full ${getScoreBg(breakdown.gymAdherence)}`} style={{ width: `${breakdown.gymAdherence}%` }}></div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
