import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { geminiService, HealthRecommendation } from '../services/geminiService';
import { getErrorMessage } from '../services/apiClient';

const RecommendationsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // New state for AI chat feature
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [apiTestResult, setApiTestResult] = useState<string>('');

  const categories = [
    { id: 'all', name: 'All', icon: '📊' },
    { id: 'nutrition', name: 'Nutrition', icon: '🍎' },
    { id: 'exercise', name: 'Exercise', icon: '💪' },
    { id: 'sleep', name: 'Sleep', icon: '😴' },
    { id: 'mental', name: 'Mental Health', icon: '🧠' },
    { id: 'general', name: 'General', icon: '💡' }
  ];

  const generateAIRecommendations = async () => {
    setIsLoading(true);
    setError('');
    setHasGenerated(false);

    try {
      // Mock user profile - in real app, this would come from user data
      const userProfile = {
        age: 28,
        gender: 'male',
        height: 175,
        weight: 70,
        activityLevel: 'moderate',
        goals: ['weight loss', 'muscle gain', 'better sleep']
      };

      const aiRecommendations = await geminiService.getHealthRecommendations(userProfile);
      setRecommendations(aiRecommendations);
      setHasGenerated(true);
    } catch (err) {
      setError('Failed to generate AI recommendations. Please try again.');
      console.error('Error generating recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const askAIAboutFood = async () => {
    if (!userQuestion.trim()) return;
    
    setIsAskingAI(true);
    setError('');

    try {
      // Mock user profile - in real app, this would come from user data
      const userProfile = {
        age: 28,
        gender: 'male',
        height: 175,
        weight: 70,
        activityLevel: 'moderate',
        goals: ['weight loss', 'muscle gain', 'better sleep']
      };

      console.log('Starting AI request...');
      const response = await geminiService.askAboutFoodAndHealth(userQuestion, userProfile);
      console.log('AI response received:', response);
      
      // Add to chat history
      setChatHistory(prev => [...prev, { question: userQuestion, answer: response }]);
      setUserQuestion('');
    } catch (err) {
      console.error('Error asking AI:', err);
      setError(`Failed to get AI response: ${getErrorMessage(err)}. Please try again.`);
    } finally {
      setIsAskingAI(false);
    }
  };

  const testAPIConnection = async () => {
    setApiTestResult('🔍 Testing API connection...');
    try {
      const isWorking = await geminiService.testConnection();
      setApiTestResult(isWorking ? '✅ API connection successful!' : '❌ API connection failed');
    } catch (err) {
      setApiTestResult(`❌ API test error: ${getErrorMessage(err)}`);
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nutrition': return '🍎';
      case 'exercise': return '💪';
      case 'sleep': return '😴';
      case 'mental': return '🧠';
      case 'general': return '💡';
      default: return '💡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition': return '#10b981';
      case 'exercise': return '#3b82f6';
      case 'sleep': return '#8b5cf6';
      case 'mental': return '#ef4444';
      case 'general': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 md:p-8 font-sans space-y-8 animate-fade-in-up">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-[#ccff00] bg-clip-text text-transparent flex items-center gap-2">
              💡 AI Health Recommendations
            </h1>
            <p className="text-slate-400 font-medium mt-1">Personalized health intelligence and diet guidance powered by Gemini</p>
          </div>
          {!hasGenerated && !isLoading && (
            <button
              onClick={generateAIRecommendations}
              className="bg-[#ccff00] text-slate-950 font-extrabold px-6 py-3 rounded-xl hover:bg-[#b5e000] active:scale-95 transition-all shadow-[0_4px_15px_rgba(204,255,0,0.2)] text-sm flex items-center gap-2"
            >
              🤖 Generate AI Recommendations
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-[#ccff00] rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              AI is analyzing your profile...
            </h3>
            <p className="text-slate-400 text-sm">
              Generating personalized health recommendations based on your data
            </p>
          </div>
        )}

        {!hasGenerated && !isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Generate Recommendations Card */}
            <div className="text-center p-8 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl">🤖</div>
              <h3 className="text-xl font-bold text-white">
                Get AI Recommendations
              </h3>
              <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                Get personalized health recommendations based on your profile and goals.
              </p>
              <button
                onClick={generateAIRecommendations}
                className="bg-[#ccff00] text-slate-950 font-extrabold px-6 py-3 rounded-xl hover:bg-[#b5e000] active:scale-95 transition-all shadow-[0_4px_15px_rgba(204,255,0,0.2)] text-sm"
              >
                Generate Recommendations
              </button>
            </div>

            {/* Ask AI About Food Card */}
            <div className="p-8 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850 space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🍎</div>
                <h3 className="text-xl font-bold text-white">
                  Ask AI About Food & Health
                </h3>
              </div>
              
              <p className="text-slate-400 text-xs leading-relaxed">
                Ask questions about food, nutrients, health issues, and how they relate to your goals.
              </p>

              <div>
                <textarea
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask about food, nutrients, health issues... (e.g., 'What foods help with muscle gain?', 'Is quinoa good for weight loss?')"
                  className="w-full p-4 bg-slate-950 border border-slate-850 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00f0ff] min-h-[100px]"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={askAIAboutFood}
                  disabled={!userQuestion.trim() || isAskingAI}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                    !userQuestion.trim() || isAskingAI
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#00f0ff] text-slate-950 font-extrabold hover:bg-[#00d0e0] active:scale-95 shadow-[0_4px_15px_rgba(0,240,255,0.2)]'
                  }`}
                >
                  {isAskingAI ? '🤖 AI is thinking...' : '🤖 Ask AI'}
                </button>
                
                <button
                  onClick={testAPIConnection}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold px-5 py-3 rounded-xl transition-all text-sm flex items-center gap-2"
                >
                  🔧 Test API
                </button>
              </div>
              
              {apiTestResult && (
                <div className={`p-3 rounded-xl text-xs border ${
                  apiTestResult.includes('✅') 
                    ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-950/30 border-rose-500/20 text-rose-400'
                }`}>
                  {apiTestResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Response Display */}
        {chatHistory.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🤖 AI Health Expert
            </h3>

            {/* Chat History */}
            <div className="space-y-3">
              {chatHistory.map((chat, index) => (
                <div key={index} className="space-y-1">
                  <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl text-sm text-slate-300">
                    <span className="font-bold text-[#00f0ff] mr-1">Q:</span> {chat.question}
                  </div>
                  <div className="bg-slate-900/80 border border-slate-850/40 p-3 rounded-xl text-sm text-slate-300 leading-relaxed">
                    <span className="font-bold text-[#ccff00] mr-1">A:</span> {chat.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {hasGenerated && (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#ccff00] text-slate-950 font-extrabold shadow-[0_4px_12px_rgba(204,255,0,0.2)]'
                      : 'bg-slate-900/40 border border-slate-850 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Recommendations Grid */}
        {hasGenerated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRecommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850 p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${getCategoryColor(rec.category)}20` }}
                  >
                    <span style={{ color: getCategoryColor(rec.category) }}>
                      {getCategoryIcon(rec.category)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-[#ccff00] transition-colors">
                        {rec.title}
                      </h3>
                      <div 
                        className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-white-force"
                        style={{ backgroundColor: getPriorityColor(rec.priority) }}
                      >
                        {rec.priority}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-6 border-t border-slate-850/50 pt-4">
                  <button className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/10 rounded-xl text-xs font-bold transition-all">
                    ✓ Mark as Done
                  </button>
                  <button className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-355 hover:text-slate-200 rounded-xl text-xs font-bold transition-all">
                    📅 Schedule
                  </button>
                  <button className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-355 hover:text-slate-200 rounded-xl text-xs font-bold transition-all">
                    ℹ️ Learn More
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {hasGenerated && (
          <div className="space-y-8 mt-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-3xl text-center space-y-1">
                <div className="text-2xl">📊</div>
                <h3 className="text-xs font-bold text-slate-450">Total Suggestions</h3>
                <p className="text-2xl font-black text-[#00f0ff]">{recommendations.length}</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-3xl text-center space-y-1">
                <div className="text-2xl">🔥</div>
                <h3 className="text-xs font-bold text-slate-450">High Priority</h3>
                <p className="text-2xl font-black text-red-400">
                  {recommendations.filter(r => r.priority === 'high').length}
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-3xl text-center space-y-1">
                <div className="text-2xl">🎯</div>
                <h3 className="text-xs font-bold text-slate-450">Categories</h3>
                <p className="text-2xl font-black text-[#ccff00]">
                  {new Set(recommendations.map(r => r.category)).size}
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-3xl text-center space-y-1">
                <div className="text-2xl">🤖</div>
                <h3 className="text-xs font-bold text-slate-450">AI Verified</h3>
                <p className="text-2xl font-black text-emerald-450">✓</p>
              </div>
            </div>

            {/* Regenerate Button */}
            <div className="text-center pb-8">
              <button
                onClick={generateAIRecommendations}
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-xl inline-flex items-center gap-2 active:scale-95 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)] disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-sm"
              >
                🔄 {isLoading ? 'Generating...' : 'Generate New Recommendations'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;