# ⏱️ Jejak Waktu - Premium Time Tracker

**Jejak Waktu** is a sophisticated, modern time-tracking application designed to help you monitor your focus, manage activities, and visualize your productivity. Built with the latest web technologies, it offers a seamless and responsive experience for managing your daily agenda.

---

## ✨ Key Features

- **🎯 Precision Timer**: Toggle between a standard stopwatch or a custom countdown timer to suit your focus needs.
- **🏷️ Smart Categorization**: Organize your tasks with custom categories and vibrant color codes.
- **📅 Visual Agenda**: View your past activities on an interactive calendar to track your progress over time.
- **📊 Productivity Analytics**: Gain insights into your habits with built-in analytics and duration tracking.
- **🔔 Interactive Alarms**: Get notified when your countdown finishes with smooth, browser-native audio feedback.
- **💾 Real-time Sync**: All your data is securely stored and synchronized using Supabase.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Icons**: Lucide React & Emojis

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ (Recommended)
- A Supabase Project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/esprydi/track-agenda.git
   cd track-agenda
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (Timer, Calendar, Analytics).
- `src/lib`: Core utility functions and Supabase client configuration.
- `public`: Static assets and icons.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve **Jejak Waktu**.

---

## 📄 License

This project is licensed under the MIT License.
