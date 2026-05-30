import React from "react";
import { Recipe, SavedRecipe, MealPlan, ShoppingList } from "../types";
import {
  Activity,
  Flame,
  Bookmark,
  Calendar,
  ShoppingBag,
  Sparkles,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Heart,
  Plus
} from "lucide-react";

interface DashboardViewProps {
  displayName: string;
  recipesCount: number;
  savedCount: number;
  plansCount: number;
  listsCount: number;
  recentRecipes: Recipe[];
  onNavigateTab: (tab: "generator" | "chef" | "planner" | "shopping" | "saved") => void;
}

export default function DashboardView({
  displayName,
  recipesCount,
  savedCount,
  plansCount,
  listsCount,
  recentRecipes,
  onNavigateTab
}: DashboardViewProps) {
  // Mock weekly analytics stats for SVG visualizations (Production standard)
  const WEEKLY_STATS = [
    { day: "Mon", count: 2 },
    { day: "Tue", count: 4 },
    { day: "Wed", count: 1 },
    { day: "Thu", count: 5 },
    { day: "Fri", count: 3 },
    { day: "Sat", count: 6 },
    { day: "Sun", count: 2 }
  ];

  const maxWeeklyCount = Math.max(...WEEKLY_STATS.map((s) => s.count));

  // Favorite Cuisine mock ratios (Interactive Donut simulation)
  const FAVORITE_CUISINES = [
    { name: "Indian", percentage: 45, color: "stroke-primary-500" },
    { name: "Italian", percentage: 25, color: "stroke-orange-400" },
    { name: "Mexican", percentage: 15, color: "stroke-red-400" },
    { name: "Others", percentage: 15, color: "stroke-neutral-300" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Greetings block banner conforming to Sleek Interface */}
      <div className="p-6 md:p-8 bg-[#0F172A] border border-[#0F172A] rounded-3xl text-white space-y-2 relative overflow-hidden">
        <div className="absolute right-[-40px] bottom-[-45px] w-48 h-48 bg-[#22C55E]/10 rounded-full blur-2xl" />
        <span className="text-[10px] uppercase font-bold text-[#22C55E] tracking-widest block font-display">
          Antoinette Suite Portal
        </span>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          Welcome back, Chef {displayName}!
        </h1>
        <p className="text-xs text-[#94A3B8] max-w-lg leading-relaxed">
          Ready to engineer professional culinary menus? Optimize ingredients with Antoinette, reduce leftovers waste, or generate shopping checkers seamlessly.
        </p>
      </div>

      {/* Primary 4 Metric cards Grid wrapper conforming to Sleek Interface */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Recipes generated counter card */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col justify-center">
          <div className="flex justify-between items-center text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Generated</span>
            <Flame className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">{recipesCount * 4 + 7}</span>
            <span className="text-[10px] text-[#22C55E] font-semibold">LIFETIME</span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Recipes calculated & saved</p>
        </div>

        {/* Saved bookmarks count card */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Saved Recipes</span>
            <Bookmark className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold text-[#22C55E]">{savedCount}</span>
            <span className="text-[10px] text-[#22C55E] font-semibold">SAVED</span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Curated cooking books</p>
        </div>

        {/* Meal Plans counter card */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col justify-center">
          <div className="flex justify-between items-center text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Meal Plans</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">{plansCount + 4}</span>
            <span className="text-[10px] text-blue-500 font-semibold">PROGRAMS</span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Active fitness calendars</p>
        </div>

        {/* Shopping list checklists count card */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col justify-center">
          <div className="flex justify-between items-center text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Shopping Items</span>
            <ShoppingBag className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">{listsCount + 14}</span>
            <span className="text-[10px] text-orange-500 font-semibold">ACTIVE</span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Procurement checker items</p>
        </div>

      </div>

      {/* Analytics Visuals grid column (Weekly stat charts + Cuisines donuts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Weekly Generations SVG Bar Chat */}
        <div className="md:col-span-2 p-6 bg-white border border-[#E2E8F0] rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Weekly Generations Activity
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">AI recipe calculation events by weekday</p>
            </div>
            <Activity className="w-5 h-5 text-[#64748B]" />
          </div>

          <div className="h-44 flex items-end justify-between pt-6 px-4 pb-2 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]" id="weekly-activity-svg-widget">
            {WEEKLY_STATS.map((s) => {
              const heightPct = Math.round((s.count / maxWeeklyCount) * 100);
              return (
                <div key={s.day} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-[#0F172A] text-white px-2 py-0.5 rounded-lg font-mono transition-opacity">
                    {s.count}
                  </span>
                  <div className="w-6 sm:w-8 bg-[#E2E8F0] rounded-md overflow-hidden h-28 flex items-end">
                    <div
                      className="bg-[#22C55E] rounded-sm w-full hover:bg-[#16A34A] transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono">{s.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Cuisine ratio donut representation */}
        <div className="p-6 bg-white border border-[#E2E8F0] rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Favorite Cuisine Share
            </h3>
            <TrendingUp className="w-4 h-4 text-[#64748B]" />
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            
            {/* Elegant Custom CSS/SVG donut wheel */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Underlay tracking circle */}
                <circle cx="56" cy="56" r="45" className="fill-transparent stroke-[#F8FAFC] stroke-[8]" />
                
                {/* Overlay calculated share segments */}
                <circle cx="56" cy="56" r="45" className="fill-transparent stroke-[#22C55E] stroke-[9]" strokeDasharray="282" strokeDashoffset="126" />
                <circle cx="56" cy="56" r="45" className="fill-transparent stroke-orange-400 stroke-[9]" strokeDasharray="282" strokeDashoffset="198" />
                <circle cx="56" cy="56" r="45" className="fill-transparent stroke-red-400 stroke-[9]" strokeDasharray="282" strokeDashoffset="242" />
              </svg>
              <div className="absolute text-center">
                <span className="text-xs font-bold text-[#0F172A] block">Indian</span>
                <span className="text-[10px] text-[#64748B] block">45% Favor</span>
              </div>
            </div>

            {/* Labels legends mapping */}
            <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-[#F1F5F9]">
              {FAVORITE_CUISINES.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                    item.color === "stroke-primary-500" ? "bg-[#22C55E]" :
                    item.color === "stroke-orange-400" ? "bg-orange-400" :
                    item.color === "stroke-red-400" ? "bg-red-400" : "bg-neutral-300"
                  }`} />
                  <span className="text-[#64748B] font-semibold">{item.name}</span>
                  <strong className="text-[#0F172A] ml-auto font-mono">{item.percentage}%</strong>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Quick Launch Buttons Matrix */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-extrabold text-[#64748B] tracking-wider">
          Quick Launch Core Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          <button
            onClick={() => onNavigateTab("generator")}
            className="p-5 text-left bg-white border border-[#E2E8F0] hover:border-[#22C55E] rounded-2xl shadow-sm transition-all flex flex-col justify-between h-32 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#22C55E] mb-2 group-hover:bg-[#22C55E] group-hover:text-white transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1 group-hover:text-[#22C55E] transition-all">
                Smart Generator
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">Calculate dishes from ingredients checklist models</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("chef")}
            className="p-5 text-left bg-white border border-[#E2E8F0] hover:border-[#22C55E] rounded-2xl shadow-sm transition-all flex flex-col justify-between h-32 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#22C55E] mb-2 group-hover:bg-[#22C55E] group-hover:text-white transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1 group-hover:text-[#22C55E] transition-all">
                AI Chef Chat
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">Consult Antoinette on stove temps, flavor ratios & swaps</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("planner")}
            className="p-5 text-left bg-white border border-[#E2E8F0] hover:border-[#22C55E] rounded-2xl shadow-sm transition-all flex flex-col justify-between h-32 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#22C55E] mb-2 group-hover:bg-[#22C55E] group-hover:text-white transition-all">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1 group-hover:text-[#22C55E] transition-all">
                Meal Planner Calendar
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">Map calorie targets of fitness programs daily</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("shopping")}
            className="p-5 text-left bg-white border border-[#E2E8F0] hover:border-[#22C55E] rounded-2xl shadow-sm transition-all flex flex-col justify-between h-32 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#22C55E] mb-2 group-hover:bg-[#22C55E] group-hover:text-white transition-all">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1 group-hover:text-[#22C55E] transition-all">
                Shopping Checklist
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">Collect missing ingredients & check off supermarket trips</p>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}
