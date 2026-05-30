import React, { useState, useEffect } from "react";
import { subscribeAuth } from "./services/firebase";
import { Recipe, SavedRecipe, MealPlan, ShoppingList } from "./types";
import {
  getSavedRecipesList,
  getAllRecipes,
  saveRecipeToFavorites,
  removeRecipeFromFavorites,
  isMockDb,
  createShoppingList
} from "./services/firebase";

// Modular Views Imports
import AuthPage from "./components/AuthPage";
import DashboardView from "./components/DashboardView";
import RecipeGeneratorView from "./components/RecipeGeneratorView";
import DetailedRecipeView from "./components/DetailedRecipeView";
import AIChefAssistView from "./components/AIChefAssistView";
import MealPlannerView from "./components/MealPlannerView";
import ShoppingListView from "./components/ShoppingListView";
import AdminPanel from "./components/AdminPanel";
import UserProfileView from "./components/UserProfileView";

// Icons
import {
  ChefHat,
  Home,
  Sparkles,
  MessageSquare,
  Calendar,
  ShoppingBag,
  Heart,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  BookOpen
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [initializingAuth, setInitializingAuth] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "generator" | "chef" | "planner" | "shopping" | "saved" | "admin" | "profile">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Loaded/Calculated States Shared across Views
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedRecipesIds, setSavedRecipesIds] = useState<string[]>([]);
  const [activeViewingRecipe, setActiveViewingRecipe] = useState<Recipe | null>(null);

  // Core background listeners syncing user sessions
  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setCurrentUser(user);
      setInitializingAuth(false);
      if (user) {
        // Fetch user books
        syncUserData(user.uid);
      }
    });
    return () => unsub();
  }, []);

  const syncUserData = async (userId: string) => {
    try {
      const saved = await getSavedRecipesList(userId);
      setSavedRecipes(saved);
      setSavedRecipesIds(saved.map((s) => s.recipeId));

      const recipes = await getAllRecipes();
      setUserRecipes(recipes);
    } catch (err) {
      console.warn("Issue synchronizing state metrics internally:", err);
    }
  };

  // Bookmark / Bookmarking Toggle actions
  const handleToggleSavedRecipe = async (recipeId: string) => {
    if (!currentUser) return;
    const isAlreadySaved = savedRecipesIds.includes(recipeId);

    try {
      if (isAlreadySaved) {
        await removeRecipeFromFavorites(currentUser.uid, recipeId);
      } else {
        await saveRecipeToFavorites(currentUser.uid, recipeId);
      }
      // Re-trigger sync
      await syncUserData(currentUser.uid);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-compose shopping list from loaded meal program meals
  const handleGenerateShoppingChecklist = async (plan: MealPlan) => {
    if (!currentUser) return;

    const listId = "sl-plan-" + Date.now();
    const categoriesSeed = [
      { categoryName: "Produce", items: [] as any[] },
      { categoryName: "Dairy", items: [] as any[] },
      { categoryName: "Pantry", items: [] as any[] },
      { categoryName: "Meat & Protein", items: [] as any[] },
      { categoryName: "Others", items: [] as any[] }
    ];

    // Seed mock recipes elements based on day breakfast/lunch names
    plan.days.forEach((day) => {
      categoriesSeed[0].items.push({ name: `${day.meals.breakfast.name} Staple Greens`, quantity: "1 unit", isChecked: false });
      categoriesSeed[1].items.push({ name: `${day.meals.lunch.name} Cream / Dairy`, quantity: "1 unit", isChecked: false });
      categoriesSeed[2].items.push({ name: `${day.meals.dinner.name} Spice Packet`, quantity: "1 unit", isChecked: false });
    });

    const newShoppingList: ShoppingList = {
      listId,
      userId: currentUser.uid,
      title: `Grocery Checker: ${plan.planTitle}`,
      categories: categoriesSeed,
      createdAt: new Date().toISOString()
    };

    try {
      await createShoppingList(newShoppingList);
      setActiveTab("shopping");
    } catch (err) {
      console.error(err);
    }
  };

  // Fast Navigation link handler
  const handleNavigate = (tab: any) => {
    setActiveTab(tab);
    setActiveViewingRecipe(null);
    setMobileMenuOpen(false);
  };

  // Auth logout dispatcher
  const handleAuthLogout = () => {
    setCurrentUser(null);
    setActiveTab("dashboard");
    setActiveViewingRecipe(null);
  };

  if (initializingAuth) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center font-sans">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent animate-spin rounded-full mb-3" />
        <p className="text-xs text-neutral-400 font-display">Initializing AI Chef Workspace...</p>
      </div>
    );
  }

  // Not logged in gate
  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(u) => {
          setCurrentUser(u);
          syncUserData(u.uid);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col overflow-hidden">
      
      {/* Upper Navigation Header bar conforming to Sleek Interface h-20 bg-white border-bottom */}
      <header className="h-20 bg-white border-b border-[#E2E8F0] px-6 flex justify-between items-center sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigate("dashboard")}
            className="w-10 h-10 rounded-xl bg-[#22C55E] flex items-center justify-center text-white hover:scale-105 transition-all duration-350"
          >
            <ChefHat className="w-5 h-5 text-white" />
          </button>
          <div>
            <span className="text-sm font-bold tracking-tight text-[#0F172A] block leading-tight">
              AI Recipe Gen
            </span>
            <span className="text-[10px] text-[#22C55E] font-medium block tracking-wider uppercase font-mono">
              {isMockDb ? "Sandbox Mode" : "Native Firebase Sync"}
            </span>
          </div>
        </div>

        {/* Global actions row (desktop view) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right pl-4 border-l border-[#E2E8F0]">
            <p className="text-xs font-bold leading-tight text-[#0F172A]">
              {currentUser.displayName || "Gourmet Chef"}
            </p>
            <p className="text-[10px] text-[#64748B] font-mono lowercase">
              {currentUser.email}
            </p>
          </div>

          <button
            onClick={() => handleNavigate("profile")}
            className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold hover:scale-105 transition-all"
          >
            {currentUser.displayName ? currentUser.displayName.slice(0,1).toUpperCase() : "C"}
          </button>
        </div>

        {/* Mobile menu toggle action icon */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-xl transition-all cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Container Wrapper (Sidebar + Main Column) */}
      <div className="flex-1 flex flex-col md:flex-row relative items-stretch min-h-0">
        
        {/* Navigation Sidebar Drawer (Sleek Interface w-64 border-r border-[#E2E8F0]) */}
        <aside className={`bg-white border-r border-[#E2E8F0] w-full md:w-64 shrink-0 flex flex-col justify-between transition-all ${
          mobileMenuOpen ? "block absolute top-0 left-0 right-0 z-30 shadow-md border-b" : "hidden md:flex"
        }`}>
          
          <div className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Home },
              { id: "generator", label: "Generator", icon: Sparkles },
              { id: "chef", label: "AI Chef Assistant", icon: MessageSquare },
              { id: "planner", label: "Meal Planner", icon: Calendar },
              { id: "shopping", label: "Shopping Lists", icon: ShoppingBag },
              { id: "saved", label: "Saved Favorites", icon: Heart },
              { id: "admin", label: "Admin Insights", icon: Shield },
              { id: "profile", label: "My Preferences", icon: User }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigate(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left w-full cursor-pointer text-xs ${
                    active
                      ? "bg-[#F1F5F9] text-[#22C55E] font-semibold"
                      : "text-[#64748B] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${active ? "text-[#22C55E]" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Weekly Goal Progress section inside sidebar exactly conforming to design */}
          <div className="space-y-4">
            <div className="p-6 m-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl hidden md:block">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Weekly Goal</p>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xl font-bold">{savedRecipesIds.length}/20</span>
                <span className="text-xs text-[#22C55E] font-medium">
                  {Math.min(100, Math.round((savedRecipesIds.length / 20) * 100))}% Complete
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#22C55E] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((savedRecipesIds.length / 20) * 100))}%` }}
                ></div>
              </div>
            </div>

            {/* Quick specs footnote inside sidebar */}
            <div className="p-4 border-t border-[#E2E8F0] hidden md:block">
              <span className="text-[9px] text-[#64748B] font-mono block uppercase">
                Release Build v3.2.1
              </span>
              <span className="text-[9px] text-[#94A3B8] block">
                Sleek Interface Theme • Powered by Gemini
              </span>
            </div>
          </div>

        </aside>

        {/* Core application body views viewport viewport panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full min-h-0 bg-[#F8FAFC]">
          
          {/* Detailed Recipe Overlay (takes precedence if user clicks viewing) */}
          {activeViewingRecipe ? (
            <DetailedRecipeView
              recipe={activeViewingRecipe}
              userId={currentUser.uid}
              savedRecipesIds={savedRecipesIds}
              onToggleSavedStatus={handleToggleSavedRecipe}
              onClose={() => setActiveViewingRecipe(null)}
            />
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Dynamic Route views resolver */}
              {activeTab === "dashboard" && (
                <DashboardView
                  displayName={currentUser.displayName || "Chef"}
                  recipesCount={userRecipes.length}
                  savedCount={savedRecipesIds.length}
                  plansCount={0} // dynamically populated inside Firestore observers if expanded
                  listsCount={0}
                  recentRecipes={userRecipes.slice(-6)}
                  onNavigateTab={handleNavigate}
                />
              )}

              {activeTab === "generator" && (
                <RecipeGeneratorView
                  userId={currentUser.uid}
                  savedRecipesIds={savedRecipesIds}
                  onRecipeSavedSignal={() => syncUserData(currentUser.uid)}
                  onOpenRecipeDetail={(recipe) => setActiveViewingRecipe(recipe)}
                />
              )}

              {activeTab === "chef" && (
                <AIChefAssistView
                  userId={currentUser.uid}
                />
              )}

              {activeTab === "planner" && (
                <MealPlannerView
                  userId={currentUser.uid}
                  onGenerateShoppingListFromPlan={handleGenerateShoppingChecklist}
                />
              )}

              {activeTab === "shopping" && (
                <ShoppingListView
                  userId={currentUser.uid}
                />
              )}

              {activeTab === "saved" && (
                <div className="space-y-6">
                  
                  {/* Bookmark Title */}
                  <div className="pb-4 border-b border-[#E2E8F0]">
                    <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      My Saved Favorites Bookmarks
                    </h1>
                    <p className="text-xs text-[#64748B] mt-1">
                      Instantly inspect instructions, copy food annotations notes, or export markdown raw copies
                    </p>
                  </div>

                  {/* Layout grid bookmarks */}
                  {userRecipes.length === 0 ? (
                    <div className="bg-white border border-dashed border-[#E2E8F0] rounded-3xl p-12 text-center text-[#64748B] text-xs">
                      <BookOpen className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
                      <p className="font-bold text-[#0F172A]">No cached recipes present</p>
                      <p className="max-w-[280px] mx-auto text-[10px] leading-relaxed text-[#64748B] mt-1">
                        Utilize AI Recipe Generator parameter sliders to craft your very first dish.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userRecipes.map((r) => {
                        const isFav = savedRecipesIds.includes(r.recipeId);
                        return (
                          <div
                            key={r.recipeId}
                            className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-[#22C55E] shadow-sm hover:shadow-md transition-all text-left"
                          >
                            <div className="space-y-1">
                              <h3 className="text-sm font-bold text-[#0F172A] truncate">
                                {r.title}
                              </h3>
                              <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3">
                                {r.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-[#F1F5F9] flex justify-between items-center text-xs text-[#64748B]">
                              <span>Total Time: <strong className="font-bold text-[#0F172A]">{r.totalTime}</strong></span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleToggleSavedRecipe(r.recipeId)}
                                  className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title={isFav ? "Remove bookmark" : "Add bookmark"}
                                >
                                  <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                                </button>
                                <button
                                  onClick={() => setActiveViewingRecipe(r)}
                                  className="text-[#22C55E] hover:underline font-bold"
                                >
                                  Review
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {activeTab === "admin" && (
                <AdminPanel />
              )}

              {activeTab === "profile" && (
                <UserProfileView
                  userId={currentUser.uid}
                  email={currentUser.email}
                  displayName={currentUser.displayName}
                  onLogoutSignal={handleAuthLogout}
                />
              )}
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
