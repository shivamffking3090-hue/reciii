import React, { useState, useEffect } from "react";
import { Recipe, Note } from "../types";
import {
  saveRecipeToFavorites,
  removeRecipeFromFavorites,
  addOrEditRecipeNote,
  getRecipeNotes,
  deleteRecipeNoteFromDb
} from "../services/firebase";
import {
  Clock,
  User,
  Heart,
  Share2,
  Copy,
  Plus,
  Trash,
  Check,
  Edit2,
  ChefHat,
  MessageSquare,
  Sparkles,
  Info,
  ChevronLeft,
  BookOpen
} from "lucide-react";

interface DetailedRecipeViewProps {
  recipe: Recipe;
  userId: string;
  savedRecipesIds: string[];
  onToggleSavedStatus: (recipeId: string) => Promise<void>;
  onClose: () => void;
}

export default function DetailedRecipeView({
  recipe,
  userId,
  savedRecipesIds,
  onToggleSavedStatus,
  onClose
}: DetailedRecipeViewProps) {
  // Shared States
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(savedRecipesIds.includes(recipe.recipeId));

  // Notes system states
  const [recipeNotes, setRecipeNotes] = useState<Note[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    setIsSaved(savedRecipesIds.includes(recipe.recipeId));
    fetchNotesForThisRecipe();
  }, [recipe.recipeId, savedRecipesIds]);

  // Loading notes associated with this recipe
  const fetchNotesForThisRecipe = async () => {
    setLoadingNotes(true);
    try {
      const allNotes = await getRecipeNotes(userId);
      const filtered = allNotes.filter((n) => n.recipeId === recipe.recipeId);
      setRecipeNotes(filtered);
    } catch (err) {
      console.error("Notes load failure:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Notes CRUD dispatchers
  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    const noteId = editingNoteId || `note-${Date.now()}`;
    const newNote: Note = {
      noteId,
      recipeId: recipe.recipeId,
      userId,
      content: noteContent.trim()
    };

    try {
      await addOrEditRecipeNote(newNote);
      setNoteContent("");
      setEditingNoteId(null);
      await fetchNotesForThisRecipe();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteRecipeNoteFromDb(id);
      await fetchNotesForThisRecipe();
    } catch (err) {
      console.error(err);
    }
  };

  // Share text and links
  const handleCopyInstructions = () => {
    const textToCopy = `*** ${recipe.title} ***
${recipe.description}

Prep Time: ${recipe.prepTime} | Cooking Time: ${recipe.cookingTime} | Total: ${recipe.totalTime}
Difficulty: ${recipe.difficulty}

Ingredients:
${recipe.ingredients.map((ing, idx) => `- ${recipe.measurements[idx] || ""} ${ing}`).join("\n")}

Nutrition Estimate per Serving:
- Calories: ${recipe.nutritionSummary.calories}
- Protein: ${recipe.nutritionSummary.protein}
- Carbs: ${recipe.nutritionSummary.carbs}
- Fat: ${recipe.nutritionSummary.fat}
- Fiber: ${recipe.nutritionSummary.fiber}

Step-by-Step Cooking Instructions:
${recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}

Healthy Tips:
${recipe.healthyTips.map((tip) => `* ${tip}`).join("\n")}

Enjoy your clean AI-designed culinary creation!`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm max-w-4xl mx-auto">
      
      {/* Back button shortcut */}
      <button
        onClick={onClose}
        className="text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4 text-primary-500" />
        Return to Recipes Portal
      </button>

      {/* Main Recipe Header Block */}
      <div className="space-y-4 pb-6 border-b border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-neutral-900 tracking-tight">
              {recipe.title}
            </h1>
            <p className="text-xs text-neutral-400 font-medium">
              Handcrafted Antoinette AI Creation
            </p>
          </div>

          {/* Quick Favorite/Share Row */}
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => onToggleSavedStatus(recipe.recipeId)}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSaved
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? "fill-red-600" : ""}`} />
              {isSaved ? "Saved Favorite" : "Add Bookmark"}
            </button>

            <button
              onClick={handleCopyInstructions}
              className="p-2 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 text-neutral-600 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-primary-500" />
                  Copied Text!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Markdown Export
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-500 leading-relaxed max-w-3xl">
          {recipe.description}
        </p>

        {/* Nutritional & Metadata badging pill row */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="flex items-center gap-1 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100 text-[10px] text-neutral-600">
            <Clock className="w-3.5 h-3.5 text-primary-500" />
            <span>Prep: {recipe.prepTime} | Cooking: {recipe.cookingTime}</span>
          </div>
          <div className="flex items-center gap-1 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100 text-[10px] text-neutral-600">
            <ChefHat className="w-3.5 h-3.5 text-primary-500" />
            <span>Difficulty: <strong className="font-semibold">{recipe.difficulty}</strong></span>
          </div>
          <div className="flex items-center gap-1 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100 text-[10px] text-neutral-600">
            <User className="w-3.5 h-3.5 text-primary-500" />
            <span>Total Time: {recipe.totalTime}</span>
          </div>
        </div>
      </div>

      {/* Main Core Recipe Body Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ingredients & Prep steps */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ingredients list block */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-primary-500" />
              Ingredients & Measurements
            </h2>
            <div className="border border-neutral-100 rounded-xl overflow-hidden bg-neutral-50/30">
              <table className="w-full text-left text-xs text-neutral-600">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-100">
                    <th className="px-4 py-2">Ingredient</th>
                    <th className="px-4 py-2 text-right">Standard Quantity Measure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recipe.ingredients.map((ing, idx) => (
                    <tr key={idx} className="hover:bg-white transition-colors">
                      <td className="px-4 py-2 font-display font-medium text-neutral-900">{ing}</td>
                      <td className="px-4 py-2 text-right font-mono text-neutral-400">
                        {recipe.measurements[idx] || "As desired"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cooking directions steps block */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1">
              <ChefHat className="w-4 h-4 text-primary-500" />
              Step-by-Step Cooking Instructions
            </h2>
            <ol className="space-y-4">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-4 items-start p-3 bg-neutral-50/50 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-all">
                  <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 font-display font-semibold text-xs flex items-center justify-center shrink-0 border border-primary-100">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans pt-0.5">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

        </div>

        {/* Nutrition Analyzer, Food Pairing and Notes sidebar */}
        <div className="space-y-6">
          
          {/* Visual Nutrition metrics breakdown */}
          <div className="bg-white border border-neutral-100 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider">
                Nutrition Estimator
              </h3>
              <span className="px-1.5 py-0.5 bg-neutral-100 text-[9px] text-neutral-400 uppercase tracking-tight rounded">
                Per Serving
              </span>
            </div>

            {/* Total Calories Counter Display */}
            <div className="text-center p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-2xl font-display font-semibold text-neutral-950">
                {recipe.nutritionSummary.calories}
              </span>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mt-0.5">
                Estimated Energy Intake
              </p>
            </div>

            {/* Simulated macronutrient percentage metrics bars */}
            <div className="space-y-3 pt-2">
              {[
                { label: "Protein", val: recipe.nutritionSummary.protein, color: "bg-primary-500", rawVal: parseFloat(recipe.nutritionSummary.protein) || 20 },
                { label: "Carbs", val: recipe.nutritionSummary.carbs, color: "bg-orange-400", rawVal: parseFloat(recipe.nutritionSummary.carbs) || 30 },
                { label: "Fat", val: recipe.nutritionSummary.fat, color: "bg-red-400", rawVal: parseFloat(recipe.nutritionSummary.fat) || 12 },
                { label: "Fiber", val: recipe.nutritionSummary.fiber, color: "bg-blue-400", rawVal: parseFloat(recipe.nutritionSummary.fiber) || 5 }
              ].map((macro) => {
                // Calculate percentage based on general daily guidelines
                const targetMax = macro.label === "Protein" ? 100 : macro.label === "Carbs" ? 300 : macro.label === "Fat" ? 80 : 30;
                const percentage = Math.min(Math.round((macro.rawVal / targetMax) * 100), 100);

                return (
                  <div key={macro.label} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-neutral-600">{macro.label}</span>
                      <strong className="text-neutral-900">{macro.val}</strong>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`${macro.color} h-inherit rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sibling Food Pairings Options */}
          {recipe.servingSuggestions && recipe.servingSuggestions.length > 0 && (
            <div className="bg-neutral-50/50 border border-neutral-100 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider">
                Antoine's Pairings Tips
              </h3>
              <ul className="space-y-2">
                {recipe.servingSuggestions.map((item, idx) => (
                  <li key={idx} className="text-xs text-neutral-600 leading-normal flex items-start gap-1.5">
                    <span className="text-primary-500 text-sm mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Healthy tip box */}
          {recipe.healthyTips && recipe.healthyTips.length > 0 && (
            <div className="p-4 bg-primary-100/10 border border-primary-200 rounded-xl space-y-2 text-xs text-neutral-600">
              <span className="font-bold text-primary-700 flex items-center gap-1">
                🥑 Healthy Alternatives
              </span>
              <p className="text-[11px] leading-relaxed">
                {recipe.healthyTips[0]}
              </p>
            </div>
          )}

          {/* Personal Recipe annotations notes section */}
          <div className="bg-white border border-neutral-100 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary-500" />
              My Culinary Secret Notes
            </h3>

            {/* List existing recipe notes */}
            {loadingNotes ? (
              <p className="text-[10px] text-neutral-400 text-center py-2">Syncing notes...</p>
            ) : recipeNotes.length === 0 ? (
              <p className="text-[10px] text-neutral-400 leading-normal bg-neutral-50 p-2 text-center rounded border border-dashed border-neutral-200">
                No custom notes created. Record stove times, spice adjustments, water ratios, or personal logs here.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {recipeNotes.map((note) => (
                  <div key={note.noteId} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 space-y-1.5 text-[11px]">
                    <p className="text-neutral-600 leading-relaxed font-sans">{note.content}</p>
                    <div className="flex justify-end gap-2 text-[10px]">
                      <button
                        onClick={() => { setEditingNoteId(note.noteId); setNoteContent(note.content); }}
                        className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.noteId)}
                        className="text-red-400 hover:text-red-600 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Note input/edit forms */}
            <div className="space-y-2 border-t border-neutral-100 pt-3">
              <textarea
                rows={2}
                placeholder={editingNoteId ? "Modify secret note..." : "Add your culinary note..."}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full text-[11px] p-2 border border-neutral-200 rounded focus:outline-none focus:border-primary-500"
              />
              <div className="flex justify-between items-center">
                {editingNoteId && (
                  <button
                    onClick={() => { setEditingNoteId(null); setNoteContent(""); }}
                    className="text-[10px] text-neutral-400 hover:underline"
                  >
                    Cancel Editing
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="ml-auto bg-neutral-900 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase hover:bg-neutral-800 tracking-wider transition-colors cursor-pointer"
                >
                  {editingNoteId ? "Apply Secret Edit" : "Save Annotation"}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
