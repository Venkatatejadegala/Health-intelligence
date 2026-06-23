const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.NODE_ENV === 'test'
    ? path.join(__dirname, `../${process.env.TEST_DB_NAME || 'test_local_db'}.json`)
    : path.join(__dirname, '../local_db.json');


const initializeDb = () => {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({
            users: [],
            profiles: [],
            dailyLogs: [],
            workoutPlans: [],
            activeWorkoutPlans: [],
            progress: [],
            sessions: [],
            coachingInsights: []
        }, null, 2));
    }
};

const readDb = () => {
    initializeDb();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(data);
        if (!parsed.coachingInsights) parsed.coachingInsights = [];
        if (!parsed.activeWorkoutPlans) parsed.activeWorkoutPlans = [];
        return parsed;
    } catch (e) {
        console.error('Error reading local DB file:', e);
        return {
            users: [],
            profiles: [],
            dailyLogs: [],
            workoutPlans: [],
            progress: [],
            sessions: [],
            coachingInsights: []
        };
    }
};

const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error writing local DB file:', e);
    }
};

module.exports = {
    // User Methods
    async findUserByEmailOrUsername(email, username) {
        const db = readDb();
        return db.users.find(u => u.email === email || u.username === username) || null;
    },

    async findUserByEmail(email) {
        const db = readDb();
        return db.users.find(u => u.email === email) || null;
    },

    async createUser(username, email, password) {
        const db = readDb();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const crypto = require('crypto');
        
        const newUser = {
            _id: 'mock_user_' + Date.now(),
            username,
            email,
            password: hashedPassword,
            role: 'user',
            isSuspended: false,
            isEmailVerified: false,
            emailVerificationToken: crypto.randomBytes(32).toString('hex'),
            resetPasswordToken: null,
            resetPasswordExpires: null,
            createdAt: new Date().toISOString()
        };
        
        db.users.push(newUser);
        writeDb(db);
        return newUser;
    },

    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    // Profile Methods
    async findProfile(userId) {
        const db = readDb();
        return db.profiles.find(p => p.userId === userId) || null;
    },

    async saveProfile(userId, profileData) {
        const db = readDb();
        const index = db.profiles.findIndex(p => p.userId === userId);
        
        const profile = {
            ...profileData,
            userId,
            updatedAt: new Date().toISOString()
        };
        
        if (index > -1) {
            db.profiles[index] = { ...db.profiles[index], ...profile };
        } else {
            profile.createdAt = new Date().toISOString();
            db.profiles.push(profile);
        }
        
        writeDb(db);
        return profile;
    },

    // Daily Log Methods
    async findDailyLog(userId, dateString) {
        const db = readDb();
        // Normalize date to YYYY-MM-DD
        const targetDate = new Date(dateString).toISOString().split('T')[0];
        return db.dailyLogs.find(l => l.userId === userId && new Date(l.date).toISOString().split('T')[0] === targetDate) || null;
    },

    async findDailyLogs(userId) {
        const db = readDb();
        return db.dailyLogs.filter(l => l.userId === userId);
    },

    async saveDailyLog(userId, logData) {
        const db = readDb();
        const targetDate = new Date(logData.date || Date.now()).toISOString().split('T')[0];
        
        const index = db.dailyLogs.findIndex(l => 
            l.userId === userId && 
            new Date(l.date).toISOString().split('T')[0] === targetDate
        );
        
        const log = {
            ...logData,
            userId,
            date: logData.date || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (index > -1) {
            db.dailyLogs[index] = { ...db.dailyLogs[index], ...log };
        } else {
            log._id = 'mock_log_' + Date.now();
            log.createdAt = new Date().toISOString();
            db.dailyLogs.push(log);
        }
        
        writeDb(db);
        return log;
    },

    // Workout Plan Methods
    async findWorkoutPlan(userId) {
        const db = readDb();
        // Fallback: if no active plan is explicitly set, check activeWorkoutPlans
        const activeLink = db.activeWorkoutPlans.find(a => a.userId === userId);
        if (activeLink) {
            const activePlan = db.workoutPlans.find(p => p._id === activeLink.workoutPlanId);
            if (activePlan) return activePlan;
        }
        const plans = db.workoutPlans.filter(p => p.userId === userId);
        if (!plans.length) return null;
        // return latest
        return plans[plans.length - 1];
    },

    async findWorkoutPlanById(planId) {
        const db = readDb();
        return db.workoutPlans.find(p => p._id === planId) || null;
    },

    async findAllWorkoutPlans(userId) {
        const db = readDb();
        return db.workoutPlans.filter(p => p.userId === userId);
    },

    async findActiveWorkoutPlan(userId) {
        const db = readDb();
        const link = db.activeWorkoutPlans.find(a => a.userId === userId);
        if (!link) return null;
        return db.workoutPlans.find(p => p._id === link.workoutPlanId) || null;
    },

    async saveActiveWorkoutPlan(userId, workoutPlanId) {
        const db = readDb();
        const index = db.activeWorkoutPlans.findIndex(a => a.userId === userId);
        const link = {
            userId,
            workoutPlanId,
            updatedAt: new Date().toISOString()
        };
        if (index > -1) {
            db.activeWorkoutPlans[index] = { ...db.activeWorkoutPlans[index], ...link };
        } else {
            link._id = 'mock_active_' + Date.now();
            link.createdAt = new Date().toISOString();
            db.activeWorkoutPlans.push(link);
        }
        writeDb(db);
        return link;
    },

    async deleteWorkoutPlan(planId) {
        const db = readDb();
        db.workoutPlans = db.workoutPlans.filter(p => p._id !== planId);
        db.activeWorkoutPlans = db.activeWorkoutPlans.filter(a => a.workoutPlanId !== planId);
        writeDb(db);
        return true;
    },

    async saveWorkoutPlan(userId, planData) {
        const db = readDb();
        const newPlan = {
            ...planData,
            _id: 'mock_plan_' + Date.now(),
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        db.workoutPlans.push(newPlan);
        writeDb(db);
        return newPlan;
    },

    // Progress Methods
    async findProgress(userId) {
        const db = readDb();
        return db.progress.filter(p => p.userId === userId);
    },

    async saveProgress(userId, progressData) {
        const db = readDb();
        const newProgress = {
            ...progressData,
            _id: 'mock_prog_' + Date.now(),
            userId,
            createdAt: new Date().toISOString()
        };
        db.progress.push(newProgress);
        writeDb(db);
        return newProgress;
    },

    // Session Methods
    async findSessions(userId) {
        const db = readDb();
        return db.sessions.filter(s => s.userId === userId);
    },

    async saveSession(userId, sessionData) {
        const db = readDb();
        const newSession = {
            ...sessionData,
            _id: 'mock_sess_' + Date.now(),
            userId,
            createdAt: new Date().toISOString()
        };
        db.sessions.push(newSession);
        writeDb(db);
        return newSession;
    },

    // Coaching Insight Methods
    async findCoachingInsights(userId) {
        const db = readDb();
        return (db.coachingInsights || []).filter(c => c.userId === userId);
    },

    async saveCoachingInsight(userId, insightData) {
        const db = readDb();
        if (!db.coachingInsights) db.coachingInsights = [];
        const newInsight = {
            ...insightData,
            _id: 'mock_insight_' + Date.now(),
            userId,
            createdAt: new Date().toISOString()
        };
        db.coachingInsights.push(newInsight);
        writeDb(db);
        return newInsight;
    },

    // Extra User Methods for Recovery / Verification / Suspension
    async findUserById(id) {
        const db = readDb();
        return db.users.find(u => u._id === id || u.id === id) || null;
    },

    async updateUser(id, updates) {
        const db = readDb();
        const index = db.users.findIndex(u => u._id === id || u.id === id);
        if (index > -1) {
            db.users[index] = { ...db.users[index], ...updates };
            writeDb(db);
            return db.users[index];
        }
        return null;
    },

    async findUserByVerificationToken(token) {
        const db = readDb();
        return db.users.find(u => u.emailVerificationToken === token) || null;
    },

    async findUserByResetToken(hashedToken) {
        const db = readDb();
        return db.users.find(u => u.resetPasswordToken === hashedToken && new Date(u.resetPasswordExpires) > new Date()) || null;
    },

    async deleteUserAndProfile(userId) {
        const db = readDb();
        db.users = db.users.filter(u => u._id !== userId && u.id !== userId);
        db.profiles = db.profiles.filter(p => p.userId !== userId);
        db.dailyLogs = db.dailyLogs.filter(l => l.userId !== userId);
        db.workoutPlans = db.workoutPlans.filter(p => p.userId !== userId);
        db.activeWorkoutPlans = db.activeWorkoutPlans.filter(a => a.userId !== userId);
        db.progress = db.progress.filter(p => p.userId !== userId);
        db.sessions = db.sessions.filter(s => s.userId !== userId);
        db.coachingInsights = db.coachingInsights.filter(c => c.userId !== userId);
        if (db.notifications) {
            db.notifications = db.notifications.filter(n => n.userId !== userId);
        }
        if (db.aiUsage) {
            db.aiUsage = db.aiUsage.filter(u => u.userId !== userId);
        }
        writeDb(db);
    },

    // Notification Methods
    async createNotification(userId, title, message) {
        const db = readDb();
        if (!db.notifications) db.notifications = [];
        const notif = {
            _id: 'mock_notif_' + Date.now(),
            userId,
            title,
            message,
            read: false,
            createdAt: new Date().toISOString()
        };
        db.notifications.push(notif);
        writeDb(db);
        return notif;
    },

    async findNotifications(userId) {
        const db = readDb();
        if (!db.notifications) db.notifications = [];
        return db.notifications.filter(n => n.userId === userId);
    },

    async markNotificationRead(id, userId) {
        const db = readDb();
        if (!db.notifications) db.notifications = [];
        const notif = db.notifications.find(n => n._id === id && n.userId === userId);
        if (notif) {
            notif.read = true;
            writeDb(db);
        }
        return notif;
    },

    async markAllNotificationsRead(userId) {
        const db = readDb();
        if (!db.notifications) db.notifications = [];
        db.notifications.forEach(n => {
            if (n.userId === userId) n.read = true;
        });
        writeDb(db);
    },

    async deleteNotification(id, userId) {
        const db = readDb();
        if (!db.notifications) db.notifications = [];
        const index = db.notifications.findIndex(n => n._id === id && n.userId === userId);
        if (index > -1) {
            const notif = db.notifications[index];
            db.notifications.splice(index, 1);
            writeDb(db);
            return notif;
        }
        return null;
    },

    // AI Usage Methods
    async saveAiUsage(userId, endpoint, tokens) {
        const db = readDb();
        if (!db.aiUsage) db.aiUsage = [];
        const usage = {
            _id: 'mock_usage_' + Date.now(),
            userId,
            endpoint,
            tokens: Number(tokens),
            createdAt: new Date().toISOString()
        };
        db.aiUsage.push(usage);
        writeDb(db);
        return usage;
    },

    async findAiUsageInLast24h(userId) {
        const db = readDb();
        if (!db.aiUsage) db.aiUsage = [];
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return db.aiUsage.filter(u => u.userId === userId && new Date(u.createdAt) >= oneDayAgo);
    },

    // Admin Methods
    async getUsers() {
        const db = readDb();
        return db.users;
    },

    async getAiUsageSummary() {
        const db = readDb();
        if (!db.aiUsage) db.aiUsage = [];
        const totalTokens = db.aiUsage.reduce((sum, u) => sum + (u.tokens || 0), 0);
        const requestCount = db.aiUsage.length;
        const endpointGroups = {};
        db.aiUsage.forEach(u => {
            if (!endpointGroups[u.endpoint]) {
                endpointGroups[u.endpoint] = { totalTokens: 0, count: 0 };
            }
            endpointGroups[u.endpoint].totalTokens += u.tokens || 0;
            endpointGroups[u.endpoint].count += 1;
        });
        const endpoints = Object.keys(endpointGroups).map(name => ({
            _id: name,
            totalTokens: endpointGroups[name].totalTokens,
            count: endpointGroups[name].count
        }));
        return {
            totalTokens,
            requestCount,
            endpoints
        };
    }
};
