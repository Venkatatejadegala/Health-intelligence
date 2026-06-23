# Health Dashboard - Modern React Dashboard

A modern, responsive health tracking dashboard built with React, TypeScript, TailwindCSS, and shadcn/ui components. Features a clean sidebar navigation, dynamic page loading, and comprehensive health tracking capabilities.

## 🚀 Features

### 📱 Responsive Design
- **Mobile-first approach** with responsive sidebar
- **Collapsible sidebar** on mobile devices
- **Touch-friendly** navigation and interactions
- **Optimized layouts** for all screen sizes

### 🎨 Modern UI Components
- **shadcn/ui** components for consistent design
- **TailwindCSS** for utility-first styling
- **Lucide React** icons for modern iconography
- **Gradient backgrounds** and smooth animations
- **Custom scrollbars** and focus states

### 🧭 Navigation
- **Sidebar navigation** with 5 main sections:
  - Dashboard (Overview and stats)
  - Nutrition Tracker (Meal tracking and nutrition goals)
  - Upload Image (AI-powered food analysis)
  - Recommendations (Personalized health tips)
  - Profile (User account management)

### 📊 Dashboard Pages

#### 1. Dashboard Home
- **Welcome section** with personalized greeting
- **Stats cards** showing daily metrics (steps, calories, water, sleep)
- **Interactive charts** for weekly activity and nutrition progress
- **Quick action buttons** for common tasks

#### 2. Nutrition Tracker
- **Meal planning** with breakfast, lunch, dinner, and snacks
- **Nutrition goals** tracking (protein, carbs, fat, calories)
- **Food search** and quick add functionality
- **Recent foods** for easy logging
- **Progress visualization** with charts and progress bars

#### 3. Upload Image
- **Drag & drop** image upload interface
- **AI-powered food analysis** with confidence scores
- **Nutrition breakdown** of detected foods
- **Personalized recommendations** based on analysis
- **Tips for better image recognition**

#### 4. Recommendations
- **AI-generated suggestions** based on user data
- **Priority-based recommendations** (high, medium, low)
- **Category filtering** (nutrition, exercise, lifestyle)
- **Action plans** with specific steps
- **Progress tracking** and success rates

#### 5. Profile
- **User account management**
- **Personal information** editing
- **Health goals** and preferences
- **Account settings** and privacy controls

## 🛠️ Technical Stack

- **React 19** with TypeScript
- **React Router** for navigation
- **TailwindCSS** for styling
- **Lucide React** for icons
- **shadcn/ui** for UI components
- **Framer Motion** for animations
- **Vite** for build tooling

## 📱 Mobile Responsiveness

The dashboard is fully responsive with:
- **Collapsible sidebar** that slides in/out on mobile
- **Touch-optimized** buttons and interactions
- **Responsive grid layouts** that adapt to screen size
- **Mobile-first** design approach
- **Optimized typography** for readability on all devices

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6) to Purple (#8B5CF6) gradients
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Responsive sizing** with Tailwind's text utilities

### Components
- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Gradient backgrounds, hover animations, focus states
- **Forms**: Clean inputs with proper focus indicators
- **Charts**: Custom CSS-based visualizations

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.tsx    # Main layout with sidebar
│   │   ├── Sidebar.tsx           # Responsive sidebar navigation
│   │   └── Chart.tsx             # Reusable chart component
│   ├── pages/
│   │   ├── NutritionTrackerPage.tsx
│   │   ├── UploadImagePage.tsx
│   │   ├── RecommendationsPage.tsx
│   │   └── UserProfilePage.tsx
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication context
│   └── App.tsx                   # Main app with routing
├── public/
└── package.json
```

## 🎯 Key Features Implemented

✅ **Responsive Sidebar Layout**
- Collapsible on mobile
- Smooth animations
- Active state indicators

✅ **Dynamic Page Loading**
- React Router integration
- Smooth page transitions
- Protected routes

✅ **Modern UI Components**
- shadcn/ui integration
- Custom chart components
- Interactive cards and buttons

✅ **Mobile Responsiveness**
- Mobile-first design
- Touch-friendly interactions
- Responsive grid layouts

✅ **Health & Fitness Focus**
- Nutrition tracking
- Activity monitoring
- AI-powered recommendations
- Progress visualization

## 🔧 Customization

The dashboard is highly customizable:
- **Color themes** can be modified in Tailwind config
- **Component styles** use Tailwind utilities
- **Layout structure** is modular and reusable
- **Data sources** can be easily connected to APIs

## 📱 Mobile Experience

The dashboard provides an excellent mobile experience:
- **Touch-optimized** interface
- **Swipe gestures** for sidebar navigation
- **Responsive charts** that work on small screens
- **Fast loading** with optimized assets

## 🎨 Design Inspiration

Inspired by modern dashboard designs like:
- **Vercel Dashboard** - Clean, minimal interface
- **Notion** - Intuitive navigation and layout
- **Linear** - Modern sidebar and content areas
- **Stripe Dashboard** - Professional, data-focused design

This dashboard combines the best practices from these platforms while maintaining a unique health and fitness focus.