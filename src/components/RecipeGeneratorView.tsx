import React, { useState } from "react";
import {
  POPULAR_INGREDIENTS,
  CUISINES_LIST,
  DIET_TYPES,
  REGIONAL_INDIAN_STATES,
  REGIONAL_INTERNATIONAL,
  FESTIVALS_LIST,
  IngredientOption
} from "../data";
import { Recipe } from "../types";
import { addRecipe, saveRecipeToFavorites, getSavedRecipesList, removeRecipeFromFavorites } from "../services/firebase";
import {
  Sparkles,
  Flame,
  Clock,
  User,
  Coffee,
  Globe,
  Trash2,
  Trash,
  Check,
  Search,
  BookOpen,
  ChevronRight,
  UtensilsCrossed,
  Share2,
  Bookmark,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Layers,
  Heart,
  Copy,
  Plus
} from "lucide-react";

interface RecipeGeneratorViewProps {
  userId: string;
  onRecipeSavedSignal: () => void;
  savedRecipesIds: string[];
  onOpenRecipeDetail: (recipe: Recipe) => void;
}

export default function RecipeGeneratorView({
  userId,
  onRecipeSavedSignal,
  savedRecipesIds,
  onOpenRecipeDetail
}: RecipeGeneratorViewProps) {
  // Tabs: standard, fridge, leftover, regional, festival
  const [activeTab, setActiveTab] = useState<"standard" | "fridge" | "leftover" | "regional" | "festival">("standard");

  // Universal Options
  const [dietType, setDietType] = useState("Standard/None");
  const [cookingTime, setCookingTime] = useState("30 mins");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [servings, setServings] = useState("4");
  const [language, setLanguage] = useState("English");

  // 1. Standard inputs
  const [standardIngredients, setStandardIngredients] = useState("");
  const [cuisine, setCuisine] = useState("Global/Any");

  // 2. Smart Fridge inputs
  const [fridgeSearch, setFridgeSearch] = useState("");
  const [fridgeSelected, setFridgeSelected] = useState<string[]>([]);
  const [fridgeCategoryFilter, setFridgeCategoryFilter] = useState<string>("All");

  // 3. Leftover inputs
  const [leftoverTarget, setLeftoverTarget] = useState("");
  const [minimizeWastePrompt, setMinimizeWastePrompt] = useState("Minimize Waste, Maximize Flavor");

  // 4. Regional Heritage inputs
  const [selectedRegionType, setSelectedRegionType] = useState<"indian" | "international">("indian");
  const [selectedRegionVal, setSelectedRegionVal] = useState("Punjab");

  // 5. Traditional Festival inputs
  const [selectedFestivalIndex, setSelectedFestivalIndex] = useState(0);

  // Loading & Generator Output States
  const [generating, setGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Smart Fridge Checklist Handlers
  const handleToggleFridgeIngredient = (ingName: string) => {
    if (fridgeSelected.includes(ingName)) {
      setFridgeSelected(fridgeSelected.filter((i) => i !== ingName));
    } else {
      setFridgeSelected([...fridgeSelected, ingName]);
    }
  };

  const clearFridgeSelection = () => {
    setFridgeSelected([]);
  };

  // Main recipe generation dispatch
  const handleGenerateRecipe = async () => {
    setGenerating(true);
    setGenerationError(null);
    setGeneratedRecipe(null);

    let payload: any = {
      dietType,
      cookingTime,
      difficulty,
      servings,
      language
    };

    if (activeTab === "standard") {
      if (!standardIngredients.trim()) {
        setGenerating(false);
        setGenerationError("Please provide some ingredients or pantry items to start cooking.");
        return;
      }
      payload.ingredients = standardIngredients;
      payload.cuisine = cuisine;
    } else if (activeTab === "fridge") {
      if (fridgeSelected.length === 0) {
        setGenerating(false);
        setGenerationError("Please select at least one available ingredient from your Smart Fridge check-list.");
        return;
      }
      payload.ingredients = fridgeSelected.join(", ");
      payload.isFridgeMode = true;
      payload.cuisine = "Global/Any";
    } else if (activeTab === "leftover") {
      if (!leftoverTarget.trim()) {
        setGenerating(false);
        setGenerationError("Please list your surplus food or leftover groceries to maximize waste reduction.");
        return;
      }
      payload.targetLeftovers = leftoverTarget;
      payload.ingredients = leftoverTarget;
      payload.isLeftoverMode = true;
      payload.cuisine = "Global/Any";
    } else if (activeTab === "regional") {
      payload.regionalState = selectedRegionVal;
      payload.cuisine = selectedRegionVal;
      payload.ingredients = "Traditional staple ingredients matching this cuisine heritage";
    } else if (activeTab === "festival") {
      const fest = FESTIVALS_LIST[selectedFestivalIndex];
      payload.festivalName = fest.name;
      payload.cuisine = "Traditional festive styling";
      payload.ingredients = "Traditional ingredients associated with this celebration";
    }

    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Gourmet server failed to compile this AI recipe.");
      }

      const recipeData = await response.json();
      
      const newRecipe: Recipe = {
        recipeId: "rc-" + Date.now(),
        userId: userId,
        title: recipeData.title || "Custom AI Gourmet Creation",
        description: recipeData.description || "Freshly created based on your specific ingredients parameters.",
        ingredients: recipeData.ingredients || [],
        measurements: recipeData.measurements || [],
        prepTime: recipeData.prepTime || "10 mins",
        cookingTime: recipeData.cookingTime || "20 mins",
        totalTime: recipeData.totalTime || "30 mins",
        difficulty: recipeData.difficulty || difficulty,
        instructions: recipeData.instructions || [],
        nutritionSummary: recipeData.nutritionSummary || {
          calories: "320 kcal",
          protein: "24g",
          carbs: "30g",
          fat: "12g",
          fiber: "4g"
        },
        healthyTips: recipeData.healthyTips || [],
        servingSuggestions: recipeData.servingSuggestions || [],
        createdAt: new Date().toISOString()
      };

      // Auto add to global recipe archive in database as secondary backup
      await addRecipe(newRecipe);
      
      setGeneratedRecipe(newRecipe);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "An issue occurred communicating with the recipe rendering engine.");
    } finally {
      setGenerating(false);
    }
  };

  // Filter fridge items
  const filteredFridgeIngredients = POPULAR_INGREDIENTS.filter((ing) => {
    const matchSearch = ing.name.toLowerCase().includes(fridgeSearch.toLowerCase());
    const matchCategory = fridgeCategoryFilter === "All" || ing.category === fridgeCategoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Visual Title Header conforming to Sleek Interface */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#22C55E]" />
            AI Recipe Generator
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Produce gourmet delicacies with custom parameters matching leftovers, regions, or diets
          </p>
        </div>
      </div>

      {/* Primary Generator Mode Nav Tabs conforming to Sleek Interface pills */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl w-fit">
        <button
          onClick={() => { setActiveTab("standard"); setGenerationError(null); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "standard"
              ? "bg-[#22C55E] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          Quick Meal Craft
        </button>
        <button
          onClick={() => { setActiveTab("fridge"); setGenerationError(null); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "fridge"
              ? "bg-[#22C55E] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          Smart Fridge Checklist
        </button>
        <button
          onClick={() => { setActiveTab("leftover"); setGenerationError(null); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "leftover"
              ? "bg-[#22C55E] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          Leftover Waste Reducer
        </button>
        <button
          onClick={() => { setActiveTab("regional"); setGenerationError(null); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "regional"
              ? "bg-[#22C55E] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          Regional Heritage
        </button>
        <button
          onClick={() => { setActiveTab("festival"); setGenerationError(null); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "festival"
              ? "bg-[#22C55E] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          Traditional Festivals
        </button>
      </div>

      {/* Main Core Form Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forms Inputs Columns */}
        <div className="lg:col-span-2 space-y-6 bg-white border border-[#E2E8F0] p-6 md:p-8 rounded-3xl shadow-sm">
          
          {/* TAB 1: QUICK STYLE */}
          {activeTab === "standard" && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                What's in your fridge?
              </label>
              <textarea
                rows={4}
                placeholder="E.g., Chicken breast, spinach, heavy cream, garlic, parmesan..."
                value={standardIngredients}
                onChange={(e) => setStandardIngredients(e.target.value)}
                className="w-full text-sm p-4 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] placeholder:text-[#94A3B8]"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">
                    Cuisine Vibe
                  </label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E2E8F0] rounded-xl bg-white focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] focus:outline-none"
                  >
                    {CUISINES_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex items-start gap-2">
                  <span className="text-base text-[#22C55E]">💡</span>
                  <p className="text-[10px] text-[#64748B] leading-relaxed">
                    Give raw lists of items, and our gourmet rendering AI will calculate ideal complementing combinations instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART FRIDGE INTERACTIVE SELECTOR */}
          {activeTab === "fridge" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-medium text-neutral-500">
                    Smart Fridge Mode Ingredients Check-list
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    Select ingredients physically present in your fridge right now
                  </p>
                </div>
                {fridgeSelected.length > 0 && (
                  <button
                    onClick={clearFridgeSelection}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1 self-start"
                  >
                    <Trash className="w-3.5 h-3.5" /> Clear All Selection ({fridgeSelected.length})
                  </button>
                )}
              </div>

              {/* Filters & Search Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search standard ingredients..."
                    value={fridgeSearch}
                    onChange={(e) => setFridgeSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                  />
                </div>
                <select
                  value={fridgeCategoryFilter}
                  onChange={(e) => setFridgeCategoryFilter(e.target.value)}
                  className="text-xs p-1.5 border border-neutral-200 rounded-lg bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Protein">Protein</option>
                  <option value="Pantry">Pantry</option>
                </select>
              </div>

              {/* Tag Selection Matrix */}
              <div className="border border-neutral-100 rounded-xl p-3 bg-neutral-50/50 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredFridgeIngredients.map((item) => {
                    const isSel = fridgeSelected.includes(item.name);
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleToggleFridgeIngredient(item.name)}
                        className={`p-2 rounded-lg text-left text-xs transition-all border flex items-center justify-between cursor-pointer ${
                          isSel
                            ? "bg-primary-50 text-primary-700 border-primary-300"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {isSel ? (
                          <Check className="w-3.5 h-3.5 shrink-0 text-primary-500 ml-1" />
                        ) : (
                          <span className="text-[9px] text-neutral-300 uppercase shrink-0 ml-1">
                            {item.category.slice(0, 3)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected summary */}
              {fridgeSelected.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 bg-primary-100/10 p-2 rounded-lg border border-primary-100">
                  <span className="text-[10px] uppercase font-semibold text-primary-600 mr-2">Selected:</span>
                  {fridgeSelected.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 text-[10px] bg-white border border-primary-200 rounded-full text-primary-700 flex items-center"
                    >
                      {name}
                      <button
                        onClick={() => handleToggleFridgeIngredient(name)}
                        className="ml-1 text-red-400 hover:text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEFTOVER REDUCER */}
          {activeTab === "leftover" && (
            <div className="space-y-4">
              <div className="bg-yellow-50/40 border border-yellow-200 p-3 rounded-lg text-xs flex gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Zero Food Waste AI Initiative:</span>
                  <p className="text-[10px] mt-0.5 text-neutral-500">
                    Input excess vegetables, cooked rice, dry bread, or leftovers. Antoinette will engineer customized dishes purely focusing on delicious repurposing.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-500">
                  Leftovers / Overripe Fruits / Dry Bread
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g., Leftover cooked white rice, slightly soft tomatoes, 2 boiled potatoes..."
                  value={leftoverTarget}
                  onChange={(e) => setLeftoverTarget(e.target.value)}
                  className="w-full text-sm p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 placeholder:text-neutral-300"
                />
              </div>
            </div>
          )}

          {/* TAB 4: REGIONAL HERITAGE */}
          {activeTab === "regional" && (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-neutral-100 pb-2">
                <button
                  type="button"
                  onClick={() => { setSelectedRegionType("indian"); setSelectedRegionVal("Punjab"); }}
                  className={`text-xs font-medium pb-1 border-b-2 transition-all ${
                    selectedRegionType === "indian"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Indian Culinary Heritage State
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedRegionType("international"); setSelectedRegionVal("Italian"); }}
                  className={`text-xs font-medium pb-1 border-b-2 transition-all ${
                    selectedRegionType === "international"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  International Culinary Vibe
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Select Heritage Culture
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(selectedRegionType === "indian" ? REGIONAL_INDIAN_STATES : REGIONAL_INTERNATIONAL).map((val) => (
                    <button
                      key={val}
                      onClick={() => setSelectedRegionVal(val)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        selectedRegionVal === val
                          ? "bg-primary-50 text-primary-700 border-primary-500 shadow-sm"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <span>{val} Style</span>
                      {selectedRegionVal === val && <ChevronRight className="w-3.5 h-3.5 text-primary-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TRADITIONAL FESTIVAL SELECTOR */}
          {activeTab === "festival" && (
            <div className="space-y-4">
              <div className="bg-primary-50/50 p-3 rounded-lg border border-primary-200 text-primary-800 text-xs">
                🎨 Celebratory recipes feature historical roots, holiday ingredients, and native methods.
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-500">
                  Select Holiday / Festival Celebration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FESTIVALS_LIST.map((fest, index) => (
                    <button
                      key={fest.name}
                      onClick={() => setSelectedFestivalIndex(index)}
                      className={`p-2.5 rounded-lg border text-left rounded-xl transition-all cursor-pointer ${
                        selectedFestivalIndex === index
                          ? "bg-primary-50 border-primary-500 text-primary-700 shadow-sm"
                          : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-600"
                      }`}
                    >
                      <span className="font-display font-medium text-xs block">{fest.name}</span>
                      <span className="text-[9px] text-neutral-400 block truncate">
                        {fest.culturalBackground.slice(0, 40)}...
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informative description showcase card */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-600 space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Cultural Context Background:</span>
                <p className="font-medium text-neutral-800 font-display">
                  {FESTIVALS_LIST[selectedFestivalIndex].name} Traditional Heritage
                </p>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  {FESTIVALS_LIST[selectedFestivalIndex].culturalBackground}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Universal Diet & Style Setup Controls Columns */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-100 p-5 rounded-xl space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider">
              Dietary Preferential Settings
            </h3>

            {/* Diet Options */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Diet Preference
              </label>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-white"
              >
                {DIET_TYPES.map((dt) => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>

            {/* Cooking budget Slider / Selects */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Target Cooking Duration
              </label>
              <select
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-white"
              >
                <option value="15 mins">Super Fast (&lt; 15 mins)</option>
                <option value="30 mins">Standard (30 mins)</option>
                <option value="45 mins">Gourmet (45 mins)</option>
                <option value="1 hour">Slow Cooked (&gt; 1 hour)</option>
              </select>
            </div>

            {/* Skills Level */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Chef Level Complexity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Beginner", "Intermediate", "Expert"].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-1.5 text-[10px] font-semibold border rounded-lg uppercase tracking-tight text-center cursor-pointer transition-colors ${
                      difficulty === diff
                        ? "bg-neutral-900 text-white border-neutral-950"
                        : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Servings Count Target
              </label>
              <select
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-white"
              >
                <option value="1">1 Person</option>
                <option value="2">2 Persons</option>
                <option value="4">4 Persons (Standard)</option>
                <option value="6">6 Persons</option>
                <option value="8">8 Persons</option>
              </select>
            </div>

            {/* Language targeting */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Select Recipe Output Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-white"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
              </select>
            </div>

            {/* ERROR FEEDBACK */}
            {generationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                <span className="font-semibold block mb-0.5">Calculation Fault:</span>
                {generationError}
              </div>
            )}

            {/* EXTREME GREEN COMPILE TRIGGER BUTTON */}
            <button
              onClick={handleGenerateRecipe}
              disabled={generating}
              className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg border-b border-primary-700 font-display transition-colors shadow-sm disabled:bg-neutral-200 disabled:text-neutral-400 cursor-pointer flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full inline-block" />
                  Engineering AI Cuisine...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  Compile AI Recipe
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Generated output modal display shortcut once created */}
      {generatedRecipe && (
        <div className="bg-primary-50/20 p-5 rounded-2xl border border-primary-200 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 text-[9px] bg-primary-100 text-primary-800 rounded font-semibold uppercase">
              Freshly Compiled Creation
            </span>
            <h2 className="text-lg font-display font-semibold text-neutral-900">
              {generatedRecipe.title}
            </h2>
            <p className="text-xs text-neutral-400 leading-normal max-w-xl">
              {generatedRecipe.description}
            </p>
          </div>
          <button
            onClick={() => onOpenRecipeDetail(generatedRecipe)}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-900 active:bg-neutral-800 text-white text-xs font-semibold uppercase rounded-lg shadow shrink-0 cursor-pointer transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            Review Full Recipe & Instructions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
