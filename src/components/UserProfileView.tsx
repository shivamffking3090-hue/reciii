import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { getUserProfile, saveUserProfile, logoutUser } from "../services/firebase";
import {
  User,
  Heart,
  ChevronRight,
  Sparkles,
  Award,
  Key,
  Shield,
  Trash2,
  Calendar,
  Layers,
  Clock,
  Compass,
  CheckCircle,
  HelpCircle,
  LogOut
} from "lucide-react";

interface UserProfileViewProps {
  userId: string;
  email: string;
  displayName: string;
  onLogoutSignal: () => void;
}

export default function UserProfileView({ userId, email, displayName, onLogoutSignal }: UserProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Preference fields editing states
  const [editCuisine, setEditCuisine] = useState("");
  const [editDiet, setEditDiet] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const p = await getUserProfile(userId);
      if (p) {
        setProfile(p);
        setEditCuisine(p.preferences.cuisine);
        setEditDiet(p.preferences.diet);
        setEditLanguage(p.preferences.language);
        setEditName(p.name);
      } else {
        // Build raw defaults
        const defaultProf: UserProfile = {
          userId,
          name: displayName || email.split("@")[0] || "Chief Gourmet",
          email,
          createdAt: new Date().toISOString(),
          preferences: { cuisine: "Global/Any", language: "English", diet: "Standard/None" }
        };
        setProfile(defaultProf);
        setEditCuisine("Global/Any");
        setEditDiet("Standard/None");
        setEditLanguage("English");
        setEditName(displayName);
      }
    } catch (err) {
      console.error("Profile sync issue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setSaving(true);
    setAlertMsg(null);

    const updatedProfile: UserProfile = {
      userId,
      name: editName.trim(),
      email,
      createdAt: profile?.createdAt || new Date().toISOString(),
      preferences: {
        cuisine: editCuisine,
        diet: editDiet,
        language: editLanguage
      }
    };

    try {
      await saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setAlertMsg("Preferences updated successfully! Antoinette AI has adapted algorithms to your custom styling.");
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerLogout = async () => {
    if (window.confirm("Do you wish to secure terminate this gourmet session?")) {
      try {
        await logoutUser();
        onLogoutSignal();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      
      {/* Title Header conforming to Sleek Interface */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <User className="w-5 h-5 text-[#22C55E]" />
            My Chef Profile
          </h1>
          <p className="text-xs text-[#64748B]">
            Customize target language, adaptive diet profiles, or inspect lifetime credentials
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left identity card using Sleek Interface rounded-3xl and green accents */}
        <div className="md:col-span-1 bg-white border border-[#E2E8F0] p-6 rounded-3xl space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center border border-[#E2E8F0] mx-auto text-[#22C55E] font-bold text-xl">
            {displayName.slice(0, 1).toUpperCase() || "C"}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A] leading-snug">
              {displayName}
            </h2>
            <p className="text-xs text-[#64748B] font-mono tracking-tight lowercase">
              {email}
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 text-left text-[11px] text-[#64748B]">
            <span>Security ID Clearance:</span>
            <span className="font-mono text-[9px] text-[#0F172A] block truncate leading-normal">
              {userId}
            </span>
            <span className="block border-t border-[#E2E8F0] pt-1 text-[9px]">
              Active session saved in persistent browser context
            </span>
          </div>

          <button
            onClick={handleTriggerLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out Gourmet Session
          </button>
        </div>

        {/* Right Configuration Form using Sleek Interface */}
        <div className="md:col-span-2 space-y-4">
          
          <form onSubmit={handleUpdatePreferences} className="bg-white border border-[#E2E8F0] p-6 rounded-3xl space-y-5 shadow-sm">
            <h3 className="text-xs uppercase font-extrabold text-[#64748B] tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#22C55E]" />
              Algorithmic Custom Preferences
            </h3>

            {alertMsg && (
              <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl leading-normal">
                {alertMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Display name */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">
                  Public Name Identifier
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                  required
                />
              </div>

              {/* Cuisine default choice */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">
                  Default Cuisine Style
                </label>
                <select
                  value={editCuisine}
                  onChange={(e) => setEditCuisine(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                >
                  <option value="Global/Any">Global / Any Vibe</option>
                  <option value="Indian">Traditional Indian</option>
                  <option value="Italian">Classic Italian</option>
                  <option value="Mexican">Fiesta Mexican</option>
                  <option value="Chinese">Szechuan Chinese</option>
                  <option value="Japanese">Zen Japanese</option>
                </select>
              </div>

              {/* Default diet preference */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">
                  Default Diet Limitation
                </label>
                <select
                  value={editDiet}
                  onChange={(e) => setEditDiet(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                >
                  <option value="Standard/None">Standard / Non-restrictive</option>
                  <option value="Vegetarian">Pure Vegetarian</option>
                  <option value="Vegan">Vegan Raw Greens</option>
                  <option value="Keto">Keto High Fat</option>
                  <option value="Low Carb">Low Carb split</option>
                  <option value="Gluten Free">Gluten Free grains</option>
                </select>
              </div>

              {/* Language choice */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">
                  Primary Calculated Language
                </label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Marathi">Marathi (மराठी)</option>
                </select>
              </div>

            </div>

            <div className="flex justify-end pt-3 border-t border-[#F1F5F9]">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold py-2.5 px-6 uppercase tracking-wider rounded-xl shadow-md shadow-[#22C55E]/15 transition-all cursor-pointer disabled:bg-[#E2E8F0] disabled:text-neutral-400"
              >
                {saving ? "Deploying..." : "Update Preferences"}
              </button>
            </div>
          </form>

        </div>

      </div>

    </div>
  );
}
