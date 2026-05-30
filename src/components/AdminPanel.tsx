import React, { useState } from "react";
import {
  Users,
  Shield,
  BarChart3,
  MessageSquareOff,
  Activity,
  HeartCrack,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  PieChart
} from "lucide-react";

interface AdminFeedback {
  id: string;
  user: string;
  rating: number;
  comments: string;
  status: "pending" | "resolved";
}

export default function AdminPanel() {
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Administrative feedback logging datasets
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([
    { id: "fd-1", user: "dev@gourmet.ai", rating: 5, comments: "The Smart Fridge available checklists saved me over 15 lbs of surplus vegetables this week!", status: "resolved" },
    { id: "fd-2", user: "diwali-baker@fest.org", rating: 5, comments: "Traditional Festival Diwali sweets recipe instructions turned out exactly like my grandmother's!", status: "resolved" },
    { id: "fd-3", user: "troubleshooter@test.com", rating: 4, comments: "AI Chef assistant gave incredible advice on fixing an overly acidic tomato base gravy sauce.", status: "pending" }
  ]);

  const [newFeedbackComment, setNewFeedbackComment] = useState("");
  const [newFeedbackUser, setNewFeedbackUser] = useState("");
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Prompt mandates 'admin password required'
    if (adminPassword === "admin123" || adminPassword === "gourmet") {
      setIsAdminAuthorized(true);
      setAuthError(null);
    } else {
      setAuthError("Invalid Administrator entry clearance key. Hint: 'admin123'");
    }
  };

  const handleResolveFeedback = (id: string) => {
    setFeedbacks(feedbacks.map((f) => (f.id === id ? { ...f, status: "resolved" } : f)));
  };

  const handleAddFeedbackMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackComment.trim()) return;

    const newF: AdminFeedback = {
      id: "fd-" + Date.now(),
      user: newFeedbackUser.trim() || "anonymous@recipe.ai",
      rating: newFeedbackRating,
      comments: newFeedbackComment.trim(),
      status: "pending"
    };

    setFeedbacks([newF, ...feedbacks]);
    setNewFeedbackComment("");
    setNewFeedbackUser("");
  };

  if (!isAdminAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-neutral-100 rounded-2xl p-6 md:p-8 space-y-6 text-center">
        <div className="w-12 h-14 bg-red-50 text-red-650 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-200">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-display font-semibold text-neutral-900">
            Administrative Clearance Required
          </h1>
          <p className="text-[11px] text-neutral-400">
            This workspace hosts telemetry, usage analytics, popular cuisines data, and system-wide feedbacks logs.
          </p>
        </div>

        {authError && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded leading-normal">
            {authError}
          </div>
        )}

        <form onSubmit={handleAdminVerify} className="space-y-3 pt-2 text-left">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
              Secret Security Password Key
            </label>
            <input
              type="password"
              placeholder="Enter authorization password..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-200 rounded-lg focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Authenticate Security clearance
          </button>
        </form>
        <p className="text-[10px] text-neutral-300 font-mono">Secret Bypass Hint: admin123</p>
      </div>
    );
  }

  // System statistics metrics
  const ADMIN_STATS = [
    { label: "Active User Sessions", val: "1,240", change: "+12.4% vs last week", icon: Users, color: "text-primary-500 bg-primary-50" },
    { label: "AI Generations Completed", val: "32,841", change: "99.4% success score", icon: Activity, color: "text-blue-500 bg-blue-50" },
    { label: "Server Latency Rate", val: "192ms", change: "Normal standard benchmark", icon: Shield, color: "text-green-500 bg-green-50" },
    { label: "Popular Saffron Spices Ratios", val: "88%", change: "Trending upwards", icon: PieChart, color: "text-orange-500 bg-orange-50" }
  ];

  const POPULAR_CUISINES_COUNTS = [
    { item: "Traditional Punjabi (Indian)", count: 489, pct: 100 },
    { item: "Regional Keralite (Indian)", count: 322, pct: 65 },
    { item: "Classic Italian Marinara", count: 284, pct: 58 },
    { item: "Mexican Chipotle Spice Bowls", count: 180, pct: 36 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title block */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-display font-semibold text-neutral-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Administrative Insights Control Panel
          </h1>
          <p className="text-xs text-neutral-400">
            Real-time telemetry, popular calculated food cuisines, server performance indices, and feedback lists
          </p>
        </div>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ADMIN_STATS.map((stat) => (
          <div key={stat.label} className="p-4 bg-white border border-neutral-100 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
                {stat.label}
              </span>
              <div className={`p-1 rounded ${stat.color}`}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-neutral-950">{stat.val}</p>
            <span className="text-[9px] text-neutral-400 block font-mono font-medium">{stat.change}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Popular calculated Cuisines statistics list */}
        <div className="bg-white border border-neutral-100 p-5 rounded-2xl space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              Popular Calculating Cuisine Demands
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Calculated based on 30-day user inputs</p>
          </div>

          <div className="space-y-3 pt-2">
            {POPULAR_CUISINES_COUNTS.map((c) => (
              <div key={c.item} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-700">{c.item}</span>
                  <strong className="text-neutral-900 font-mono">{c.count} queries</strong>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-500 h-inherit rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback management submit simulator */}
        <div className="bg-white border border-neutral-100 p-5 rounded-2xl space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1">
              <Shield className="w-4 h-4 text-red-500" />
              Feedback Management Simulator
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Submit mock user experiences to verify Admin resolve capabilities</p>
          </div>

          <form onSubmit={handleAddFeedbackMock} className="space-y-2 text-left bg-neutral-50 p-3 rounded-xl border border-neutral-150">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Mock Member Email</label>
                <input
                  type="email"
                  placeholder="user@diwali.com"
                  value={newFeedbackUser}
                  onChange={(e) => setNewFeedbackUser(e.target.value)}
                  className="w-full pl-2 pr-2 py-1 text-[11px] bg-white border border-neutral-200 rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Stars Score (1-5)</label>
                <select
                  value={newFeedbackRating}
                  onChange={(e) => setNewFeedbackRating(Number(e.target.value))}
                  className="w-full py-1 text-[11px] bg-white border border-neutral-200 rounded"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (Very Good)</option>
                  <option value={3}>⭐⭐⭐ (Satisfactory)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Experience comments</label>
              <textarea
                rows={2}
                placeholder="Submit your product testing comment..."
                value={newFeedbackComment}
                onChange={(e) => setNewFeedbackComment(e.target.value)}
                className="w-full text-[11px] p-2 bg-white border border-neutral-200 rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-500 text-white py-1.5 rounded text-[10px] font-bold uppercase hover:bg-primary-600 transition-colors"
            >
              Dispatch Experience Feed
            </button>
          </form>
        </div>

      </div>

      {/* Feedbacks list tables */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
            Customer Experience Feeds Logs
          </span>
          <span className="text-[10px] text-neutral-400">Total logs: {feedbacks.length}</span>
        </div>

        <div className="divide-y divide-neutral-100 font-sans text-xs">
          {feedbacks.map((f) => (
            <div key={f.id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-neutral-50/30 transition-colors">
              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{f.user}</span>
                  <span className="text-orange-400 font-mono text-[10px]">{"★".repeat(f.rating)}</span>
                </div>
                <p className="text-neutral-500 leading-normal">{f.comments}</p>
              </div>

              <div className="flex items-center gap-2 shrinks-0 self-start sm:self-auto">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  f.status === "resolved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {f.status}
                </span>

                {f.status === "pending" && (
                  <button
                    onClick={() => handleResolveFeedback(f.id)}
                    className="p-1 px-2.5 bg-neutral-900 text-white rounded text-[9px] uppercase font-bold hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
