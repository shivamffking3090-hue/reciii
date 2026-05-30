import React, { useState, useEffect } from "react";
import { ShoppingList, ShoppingCategory, ShoppingItem } from "../types";
import {
  getShoppingLists,
  createShoppingList,
  updateShoppingListDetails,
  deleteShoppingListFromDb
} from "../services/firebase";
import {
  ShoppingBag,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  Compass,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
  FolderPlus
} from "lucide-react";

interface ShoppingListViewProps {
  userId: string;
}

export default function ShoppingListView({ userId }: ShoppingListViewProps) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);

  // Manual list addition states
  const [loading, setLoading] = useState(false);
  const [customListName, setCustomListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1 unit");
  const [newItemCategory, setNewItemCategory] = useState("Produce");

  useEffect(() => {
    fetchSavedLists();
  }, [userId]);

  const fetchSavedLists = async () => {
    setLoading(true);
    try {
      const allLists = await getShoppingLists(userId);
      setLists(allLists);
      if (allLists.length > 0 && !activeList) {
        setActiveList(allLists[0]);
      }
    } catch (err) {
      console.error("Failed fetching grocery lists:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItemCheck = async (categoryName: string, itemName: string) => {
    if (!activeList) return;

    const updatedCategories = activeList.categories.map((cat) => {
      if (cat.categoryName === categoryName) {
        return {
          ...cat,
          items: cat.items.map((item) => (item.name === itemName ? { ...item, isChecked: !item.isChecked } : item))
        };
      }
      return cat;
    });

    const updatedList = { ...activeList, categories: updatedCategories };
    setActiveList(updatedList);

    try {
      await updateShoppingListDetails(activeList.listId, updatedList);
      // Quiet update in main reference lists
      setLists((prev) => prev.map((l) => (l.listId === activeList.listId ? updatedList : l)));
    } catch (err) {
      console.error("Failed saving item checkbox check:", err);
    }
  };

  const handleCreateCustomList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customListName.trim()) return;

    const listId = "sl-" + Date.now();
    const newList: ShoppingList = {
      listId,
      userId,
      title: customListName.trim(),
      categories: [
        { categoryName: "Produce", items: [] },
        { categoryName: "Dairy", items: [] },
        { categoryName: "Pantry", items: [] },
        { categoryName: "Meat & Protein", items: [] },
        { categoryName: "Others", items: [] }
      ],
      createdAt: new Date().toISOString()
    };

    try {
      await createShoppingList(newList);
      setCustomListName("");
      await fetchSavedLists();
      setActiveList(newList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManualItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeList) return;

    const updatedCategories = activeList.categories.map((cat) => {
      if (cat.categoryName === newItemCategory) {
        return {
          ...cat,
          items: [...cat.items, { name: newItemName.trim(), quantity: newItemQuantity, isChecked: false }]
        };
      }
      return cat;
    });

    const updatedList = { ...activeList, categories: updatedCategories };
    setActiveList(updatedList);
    setNewItemName("");
    setNewItemQuantity("1 unit");

    try {
      await updateShoppingListDetails(activeList.listId, updatedList);
      setLists((prev) => prev.map((l) => (l.listId === activeList.listId ? updatedList : l)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (window.confirm("Are you positive you want to completely delete this list?")) {
      try {
        await deleteShoppingListFromDb(id);
        const remaining = lists.filter((l) => l.listId !== id);
        setLists(remaining);
        if (activeList?.listId === id) {
          setActiveList(remaining.length > 0 ? remaining[0] : null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-display font-semibold text-neutral-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-500" />
            Shopping List Organizer
          </h1>
          <p className="text-xs text-neutral-400">
            Gather materials and track completed procurement checklist items categorised dynamically
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Manage lists index & addition forms */}
        <div className="space-y-4">
          
          {/* List selection matrix */}
          <div className="bg-white border border-neutral-100 p-4 rounded-xl space-y-3">
            <h3 className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
              Pick Checklist
            </h3>

            {lists.length === 0 ? (
              <p className="text-[10px] text-neutral-400 text-center leading-normal py-4">
                No list checklists saved. Generate lists from Meal calendars or create below.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {lists.map((l) => (
                  <div
                    key={l.listId}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      activeList?.listId === l.listId
                        ? "bg-neutral-900 border-neutral-950 text-white"
                        : "bg-neutral-50/50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveList(l)}
                      className="flex-1 text-left font-display font-medium truncate"
                    >
                      {l.title}
                    </button>
                    <button
                      onClick={() => handleDeleteList(l.listId)}
                      className="text-red-400 hover:text-red-500 transition-colors ml-2 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create custom list */}
          <form onSubmit={handleCreateCustomList} className="bg-white border border-neutral-100 p-4 rounded-xl space-y-2">
            <h3 className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider flex items-center gap-1">
              <FolderPlus className="w-3.5 h-3.5 text-primary-500" />
              New Custom Empty List
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g. Sunday Barbecue Grill"
                value={customListName}
                onChange={(e) => setCustomListName(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={!customListName.trim()}
                className="p-1 px-3 bg-neutral-950 hover:bg-neutral-900 active:bg-neutral-850 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                Create
              </button>
            </div>
          </form>

          {/* Quick instructions indicator */}
          <div className="p-3.5 bg-primary-100/10 border border-primary-200 rounded-xl text-[10px] text-neutral-400 leading-normal">
            <span className="font-bold text-primary-700 uppercase tracking-tight block mb-0.5">Integrational Value:</span>
            Generate lists directly inside meal plans or custom recipe screens. Quantities are calculated automatically by Antoinette.
          </div>

        </div>

        {/* Display checklist details */}
        <div className="lg:col-span-2">
          {activeList ? (
            <div className="bg-white border border-neutral-100 p-6 rounded-xl space-y-5 shadow-sm">
              
              {/* Checklist Headers */}
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-primary-600">Active Grocery Checklist</span>
                  <h2 className="text-base font-display font-semibold text-neutral-900">
                    {activeList.title}
                  </h2>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {new Date(activeList.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Add manual items to list in real-time */}
              <form onSubmit={handleAddManualItem} className="p-3 bg-neutral-50 rounded-xl border border-neutral-150 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Custom Item Name</label>
                  <input
                    type="text"
                    placeholder="E.g. Sweet Saffron sticks"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-white border border-neutral-250 rounded focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Quantity</label>
                  <input
                    type="text"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-white border border-neutral-250 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full bg-neutral-900 text-white rounded text-xs py-1.5 font-bold uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1 hover:bg-neutral-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Insert
                  </button>
                </div>
              </form>

              {/* Loop categories checklists */}
              <div className="space-y-4">
                {activeList.categories.map((cat, catIdx) => {
                  const hasItems = cat.items.length > 0;
                  return (
                    <div key={catIdx} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        <span>{cat.categoryName} Department</span>
                        <span className="font-mono text-[9px] lowercase text-neutral-300">
                          {cat.items.filter((i) => i.isChecked).length}/{cat.items.length} done
                        </span>
                      </div>
                      
                      {!hasItems ? (
                        <p className="text-[10px] text-neutral-300 italic p-1">No items present</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cat.items.map((item, itemIdx) => {
                            return (
                              <button
                                key={itemIdx}
                                type="button"
                                onClick={() => handleToggleItemCheck(cat.categoryName, item.name)}
                                className={`p-2.5 border rounded-lg text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                                  item.isChecked
                                    ? "bg-neutral-50 border-neutral-200 text-neutral-400 line-through"
                                    : "bg-white border-neutral-100 text-neutral-700 hover:border-neutral-300"
                                }`}
                              >
                                <span className="flex items-center gap-2 font-display">
                                  {item.isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-primary-500 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-neutral-300 shrink-0" />
                                  )}
                                  <span>{item.name}</span>
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400 font-semibold shrink-0">
                                  {item.quantity}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 text-xs">
              <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="font-medium font-display text-neutral-500">No active shopping list selected</p>
              <span className="text-[10px] text-neutral-400 mt-1 block">Create an empty checklist or review previous ones matching active calorie recipes.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
