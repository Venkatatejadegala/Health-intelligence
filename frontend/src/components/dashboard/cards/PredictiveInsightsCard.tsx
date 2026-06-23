import React from 'react';
import { motion } from 'framer-motion';

interface PredictiveInsightsCardProps {
    insights: {
        riskOfMissingGoalTomorrow: number;
        estimatedWeight30Days: number;
        streakRisk: string;
        volatility: number;
    };
}

export const PredictiveInsightsCard: React.FC<PredictiveInsightsCardProps> = ({ insights }) => {
    // Helpers for styling
    const getRiskColor = (risk: number) => {
        if (risk >= 70) return 'text-rose-400 bg-rose-500/10';
        if (risk >= 40) return 'text-amber-400 bg-amber-550/15';
        return 'text-[#00f0ff] bg-[#00f0ff]/10';
    };

    const getRiskText = (risk: number) => {
        if (risk >= 70) return 'High Risk';
        if (risk >= 40) return 'Moderate Risk';
        return 'Low Risk';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-850"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                        <span>🧠</span> Predictive ML Insights
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Based on rolling 30-day volatility</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Risk of missing goal */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-850/60 hover:border-slate-800 transition-all">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-sm ${getRiskColor(insights.riskOfMissingGoalTomorrow)}`}>
                            ⚠️
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Tomorrow's Calorie Goal</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{getRiskText(insights.riskOfMissingGoalTomorrow)} based on trends</p>
                        </div>
                    </div>
                    <p className="text-base font-black text-white font-sans">{insights.riskOfMissingGoalTomorrow}%</p>
                </div>

                {/* Weight prediction */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-850/60 hover:border-slate-800 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl text-xs text-[#00f0ff] bg-[#00f0ff]/10">
                            ⚖️
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Est. Weight in 30 Days</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Thermodynamic projection</p>
                        </div>
                    </div>
                    <p className="text-base font-black text-[#ccff00] font-sans">{insights.estimatedWeight30Days} kg</p>
                </div>

                {/* Dietary Volatility */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-850/60 hover:border-slate-800 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl text-xs text-[#ccff00] bg-[#ccff00]/10">
                            📊
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Dietary Volatility</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {insights.volatility >= 400 ? 'High fluctuation - prioritize schedule' : insights.volatility >= 150 ? 'Moderate calorie stability' : 'Excellent calorie consistency!'}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm font-black text-white font-sans">{insights.volatility} <span className="text-[10px] font-normal text-slate-500">kcal</span></p>
                </div>

                {/* Gym Streak Risk */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-850/60 hover:border-slate-800 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl text-xs text-violet-400 bg-violet-500/10">
                            🔥
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Gym Streak Status</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Risk of breaking momentum</p>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-white text-right w-20 bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg uppercase tracking-wider">{insights.streakRisk}</p>
                </div>

            </div>
        </motion.div>
    );
};
