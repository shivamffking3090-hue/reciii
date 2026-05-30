import React, { useState, useEffect } from "react";
import { MealPlan, DayPlan } from "../types";
import { createMealPlan, getMealPlans, deleteMealPlan } from "../services/firebase";
import {
  Calendar,
  Sparkles,
  Flame,
  ArrowRight,
  Trash2,
  Copy,
  Plus,
  Compass,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers
} from "lucide-react";

interface MealPlannerViewProps {
  userId: string;
  onGenerateShoppingListFromPlan: (plan: MealPlan) => void;
}

export default function MealPlannerView({ userId, onGenerateShoppingListFromPlan }: MealPlannerViewProps) {
  const [savedPlans, setSavedPlans] = useState<MealPlan[]>([]);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);

  // Form Fields
  const [dietPreference, setDietPreference] = useState("Standard/None");
  const [targetCalories, setTargetCalories] = useState("2000");
  const [goals, setGoals] = useState("Balanced body weight and muscle tone");
  const [cuisinePreference, setCuisinePreference] = useState("Indian and Mediterranean");
  const [planDuration, setPlanDuration] = useState("Weekly");

  // State managers
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedPlans();
  }, [userId]);

  const fetchSavedPlans = async () => {
    setLoading(true);
    try {
      const plans = await getMealPlans(userId);
      setSavedPlans(plans);
      if (plans.length > 0 && !activePlan) {
        setActivePlan(plans[0]);
      }
    } catch (err) {
      console.error("Meal plans loading failure:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setErrorMsg(null);

    const payload = {
      dietPreference,
      targetCalories,
      goals,
      cuisinePreference,
      planDuration
    };

    try {
      const response = await fetch("/api/mealplanner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Nutritional calculator timed out or encountered config errors.");
      }

      const planData = await response.json();
      
      const newPlan: MealPlan = {
        planId: "pl-" + Date.now(),
        userId,
        planTitle: planData.planTitle || `${planDuration} Fitness Energy Plan`,
        nutritionGoalSummary: planData.nutritionGoalSummary || `High protein split focused on ${targetCalories} calories target.`,
        days: planData.days || [],
        createdAt: new Date().toISOString()
      };

      // Save plan instantly to Firestore database
      await createMealPlan(newPlan);
      setIsCopiedText(false);

      // Refresh list
      await fetchSavedPlans();
      setActivePlan(newPlan);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed communicating with meal calculation API.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm("Do you intend to delete this customized meal plan?")) {
      try {
        await deleteMealPlan(id);
        const remaining = savedPlans.filter((p) => p.planId !== id);
        setSavedPlans(remaining);
        if (activePlan?.planId === id) {
          setActivePlan(remaining.length > 0 ? remaining[0] : null);
        }
      } catch (err) {
        console.error("Deletion failed:", err);
      }
    }
  };

  // Clipboard copies
  const [isCopiedText, setIsCopiedText] = useState(false);
  const handleCopyPlanText = () => {
    if (!activePlan) return;
    const daysStr = activePlan.days
      .map(
        (d) => `*** ${d.dayName} ***
  - Breakfast: ${d.meals.breakfast.name} (${d.meals.breakfast.calories})
  - Lunch: ${d.meals.lunch.name} (${d.meals.lunch.calories})
  - Dinner: ${d.meals.dinner.name} (${d.meals.dinner.calories})
  - Snacks: ${d.meals.snacks.name} (${d.meals.snacks.calories})`
      )
      .join("\n\n");

    const fullExport = `${activePlan.planTitle}
Nutrition Recommendation: ${activePlan.nutritionGoalSummary}

${daysStr}`;

    navigator.clipboard.writeText(fullExport);
    setIsCopiedText(true);
    setTimeout(() => setIsCopiedText(false), 2000);
  };

  // Selected Day state inside the Active Plan display
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-display font-semibold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            AI Meal Planner
          </h1>
          <p className="text-xs text-neutral-400">
            Generate custom daily, weekly diets matching fitness calories budgets, allergies, or culinary vibes
          </p>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Planner Inputs (Left column) */}
        <div className="space-y-4 bg-white border border-neutral-100 p-5 rounded-xl">
          <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1">
            <Compass className="w-4 h-4 text-primary-500" />
            Plan Parameters
          </h3>

          <div className="space-y-3">
            {/* Plan Duration settings */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Plan Duration Horizon
              </label>
              <select
                value={planDuration}
                onChange={(e) => setPlanDuration(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-white"
              >
                <option value="Daily">Daily Intake Target</option>
                <option value="Weekly">7-Day Weekly Program</option>
              </select>
            </div>

            {/* Target Calories */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Target Daily Calories Budget (kcal)
              </label>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg"
                placeholder="E.g. 1800, 2200"
              />
            </div>

            {/* Diet preferences */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Diet / Allergies Modifier
              </label>
              <input
                type="text"
                value={dietPreference}
                onChange={(e) => setDietPreference(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg"
                placeholder="E.g. Vegetarian, High Protein Keto, Nut-free"
              />
            </div>

            {/* Cuisine preference */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Preferred Cuisines Blend
              </label>
              <input
                type="text"
                value={cuisinePreference}
                onChange={(e) => setCuisinePreference(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg"
                placeholder="E.g. Indian, Italian, Spanish Tapas"
              />
            </div>

            {/* Specific personal goals info */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Fitness Goals & Intentions
              </label>
              <textarea
                rows={2}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg"
                placeholder="E.g. Mild fat loss, clean muscle building, heart-healthy fiber split..."
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200 leading-normal">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs uppercase py-2.5 rounded-lg font-display transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  Synthesizing Nutrient Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  Generate AI Plan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Plan Output Presentation & Saved archives (Right Columns) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* History selection tabs if multiple saved plans present */}
          {savedPlans.length > 0 && (
            <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-xl flex items-center gap-2 overflow-x-auto">
              <span className="text-[9px] font-extrabold uppercase text-neutral-400 tracking-wider shrink-0 mr-1">
                Saved Programs ({savedPlans.length}):
              </span>
              {savedPlans.map((p) => (
                <button
                  key={p.planId}
                  onClick={() => { setActivePlan(p); setSelectedDayIndex(0); }}
                  className={`px-3 py-1 text-[10px] font-semibold uppercase rounded transition-all shrink-0 cursor-pointer ${
                    activePlan?.planId === p.planId
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {p.planTitle.slice(0, 15)}...
                </button>
              ))}
            </div>
          )}

          {activePlan ? (
            <div className="p-6 bg-white border border-neutral-100 rounded-xl space-y-5 shadow-sm">
              
              {/* Header program titles */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-4 border-b border-neutral-150">
                <div className="space-y-1">
                  <span className="inline-block px-1.5 py-0.5 text-[9px] bg-primary-50 text-primary-700 font-bold uppercase rounded">
                    Personalized Program Overview
                  </span>
                  <h2 className="text-base font-display font-semibold text-neutral-900">
                    {activePlan.planTitle}
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-medium leading-relaxed">
                    🎯 Guideline: {activePlan.nutritionGoalSummary}
                  </p>
                </div>

                {/* Operations */}
                <div className="flex gap-2 self-start shrink-0">
                  <button
                    onClick={handleCopyPlanText}
                    className="p-1 px-2.5 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 rounded text-[10px] uppercase font-bold flex items-center gap-1 transition-colors cursor-pointer border border-neutral-200"
                  >
                    {isCopiedText ? "Copied!" : "Export Outline"}
                    {isCopiedText ? <CheckCircle className="w-3" /> : <Copy className="w-3" />}
                  </button>

                  <button
                    onClick={() => onGenerateShoppingListFromPlan(activePlan)}
                    className="p-1 px-2.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded text-[10px] uppercase font-bold flex items-center gap-1 transition-colors cursor-pointer border border-primary-200"
                  >
                    Generate Shopping List
                    <Plus className="w-3" />
                  </button>

                  <button
                    onClick={() => handleDeletePlan(activePlan.planId)}
                    className="p-1 px-2 text-red-500 bg-red-50 hover:bg-red-100 rounded cursor-pointer border border-red-100"
                    title="Delete program"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day horizontal selector strips */}
              {activePlan.days && activePlan.days.length > 0 && (
                <div className="flex gap-1 overflow-x-auto pb-1" id="days-nav-slider">
                  {activePlan.days.map((df, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => setSelectedDayIndex(fIdx)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                        selectedDayIndex === fIdx
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-50 text-neutral-600 border border-neutral-150 hover:bg-neutral-100"
                      }`}
                    >
                      {df.dayName}
                    </button>
                  ))}
                </div>
              )}

              {/* Current Selected Day Bento display grids */}
              {activePlan.days && activePlan.days[selectedDayIndex] && (
                <div className="space-y-4">
                  <div className="text-xs text-neutral-400 flex items-center gap-1">
                    <span>Active program showcase:</span>
                    <strong className="text-neutral-700">{activePlan.days[selectedDayIndex].dayName} Meals</strong>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Breakfast Bento box */}
                    <div className="p-4 bg-yellow-50/20 border border-yellow-100 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-yellow-800 uppercase tracking-wider font-extrabold font-display">
                        <span>🍳 Breakfast Meal</span>
                        <span className="font-mono bg-yellow-100/60 px-1 py-0.5 rounded">
                          {activePlan.days[selectedDayIndex].meals.breakfast.calories}
                        </span>
                      </div>
                      <p className="text-xs font-display font-medium text-neutral-900 leading-snug">
                        {activePlan.days[selectedDayIndex].meals.breakfast.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Note: {activePlan.days[selectedDayIndex].meals.breakfast.notes}
                      </p>
                    </div>

                    {/* Lunch Bento box */}
                    <div className="p-4 bg-primary-50/20 border border-primary-100 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-primary-800 uppercase tracking-wider font-extrabold font-display">
                        <span>🍱 Lunch Meal</span>
                        <span className="font-mono bg-primary-100/60 px-1 py-0.5 rounded">
                          {activePlan.days[selectedDayIndex].meals.lunch.calories}
                        </span>
                      </div>
                      <p className="text-xs font-display font-medium text-neutral-900 leading-snug">
                        {activePlan.days[selectedDayIndex].meals.lunch.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Note: {activePlan.days[selectedDayIndex].meals.lunch.notes}
                      </p>
                    </div>

                    {/* Dinner Bento box */}
                    <div className="p-4 bg-purple-50/20 border border-purple-100 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-purple-800 uppercase tracking-wider font-extrabold font-display">
                        <span>🍲 Dinner Meal</span>
                        <span className="font-mono bg-purple-100/60 px-1 py-0.5 rounded">
                          {activePlan.days[selectedDayIndex].meals.dinner.calories}
                        </span>
                      </div>
                      <p className="text-xs font-display font-medium text-neutral-900 leading-snug">
                        {activePlan.days[selectedDayIndex].meals.dinner.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Note: {activePlan.days[selectedDayIndex].meals.dinner.notes}
                      </p>
                    </div>

                    {/* Snacks Bento box */}
                    <div className="p-4 bg-orange-50/20 border border-orange-100 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-orange-850 uppercase tracking-wider font-extrabold font-display">
                        <span>🍰 Afternoon Snacks</span>
                        <span className="font-mono bg-orange-100/60 px-1 py-0.5 rounded">
                          {activePlan.days[selectedDayIndex].meals.snacks.calories}
                        </span>
                      </div>
                      <p className="text-xs font-display font-medium text-neutral-900 leading-snug">
                        {activePlan.days[selectedDayIndex].meals.snacks.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Note: {activePlan.days[selectedDayIndex].meals.snacks.notes}
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 text-xs">
              <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="font-medium font-display text-neutral-500">No active meal plan loaded</p>
              <p className="max-w-[280px] mx-auto text-[10px] leading-relaxed text-neutral-400 mt-1">
                Utilize our planner metrics form in the left sidebar configuration panel to design a custom schedule program.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
