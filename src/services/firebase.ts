import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import {
  Recipe,
  SavedRecipe,
  MealPlan,
  ShoppingList as ShoppingListType,
  ChatMessage,
  Note,
  UserProfile
} from "../types";

// Setup flag to indicate if we're using a mock/local fallback database
let isMockDb = true;
let authInstance: any = null;
let dbInstance: any = null;

try {
  // Check if firebase client config has been populated with real keys
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "mock_api_key_for_preview_compilation") {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    authInstance = getAuth(app);
    isMockDb = false;
    console.log("Firebase initialized successfully with native cloud cloudstore.");

    // Validate connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(dbInstance, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  } else {
    console.warn("Using local fallback state engine (Firebase credentials empty or sandbox environment).");
  }
} catch (e) {
  console.error("Firebase startup error, falling back securely to local storage sandbox.", e);
}

export { isMockDb };
export const auth = authInstance;
export const db = dbInstance;

// JSON error diagnostic tool mandated by secure firestore requirements
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || "mock-user-id",
      email: currentUser?.email || "sandbox@recipe.ai",
      emailVerified: currentUser?.emailVerified || false,
      isAnonymous: currentUser?.isAnonymous || false
    },
    operationType,
    path
  };
  const jsonString = JSON.stringify(errInfo);
  console.error("Firestore Error Exception raised:", jsonString);
  throw new Error(jsonString);
}


// -------------------------------------------------------------
// LOCAL STATE DATABASE FALLBACK ENGINE (For complete sandbox offline-reliability)
// -------------------------------------------------------------

const prefix = "ai_recipe_";
const getLocal = <T>(key: string): T[] => {
  const data = localStorage.getItem(prefix + key);
  return data ? JSON.parse(data) : [];
};
const setLocal = <T>(key: string, list: T[]): void => {
  localStorage.setItem(prefix + key, JSON.stringify(list));
};

const mockUserKey = prefix + "current_user";

// Authentication service proxies
export const subscribeAuth = (callback: (user: { uid: string; email: string; displayName: string } | null) => void) => {
  if (!isMockDb && authInstance) {
    return onAuthStateChanged(authInstance, (fireUser) => {
      if (fireUser) {
        callback({
          uid: fireUser.uid,
          email: fireUser.email || "",
          displayName: fireUser.displayName || fireUser.email?.split("@")[0] || "Chief Antoinette Gourmet"
        });
      } else {
        callback(null);
      }
    });
  } else {
    // Local fallback observer
    const checkState = () => {
      const persisted = localStorage.getItem(mockUserKey);
      if (persisted) {
        callback(JSON.parse(persisted));
      } else {
        callback(null);
      }
    };
    checkState();
    window.addEventListener("storage", checkState);
    return () => window.removeEventListener("storage", checkState);
  }
};

export const registerEmailPassword = async (email: string, pass: string, name: string): Promise<any> => {
  if (!isMockDb && authInstance) {
    const cred = await createUserWithEmailAndPassword(authInstance, email, pass);
    if (authInstance.currentUser) {
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        userId: cred.user.uid,
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
        preferences: { cuisine: "Global/Any", language: "English", diet: "Standard/None" }
      };
      try {
        await setDoc(doc(dbInstance, "users", cred.user.uid), userProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
      }
    }
    return { uid: cred.user.uid, email, displayName: name };
  } else {
    const mockUser = { uid: "sandbox-" + Date.now(), email, displayName: name };
    localStorage.setItem(mockUserKey, JSON.stringify(mockUser));
    // Persist profile
    const profiles = getLocal<UserProfile>("users");
    profiles.push({
      userId: mockUser.uid,
      name,
      email,
      createdAt: new Date().toISOString(),
      preferences: { cuisine: "Global/Any", language: "English", diet: "Standard/None" }
    });
    setLocal("users", profiles);
    // Raise reference storage event for triggers
    window.dispatchEvent(new Event("storage"));
    return mockUser;
  }
};

export const loginEmailPassword = async (email: string, pass: string): Promise<any> => {
  if (!isMockDb && authInstance) {
    const cred = await signInWithEmailAndPassword(authInstance, email, pass);
    return {
      uid: cred.user.uid,
      email: cred.user.email || "",
      displayName: cred.user.displayName || email.split("@")[0] || "Chef User"
    };
  } else {
    const profiles = getLocal<UserProfile>("users");
    const found = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    const matchedName = found ? found.name : email.split("@")[0];
    const mockUser = { uid: found?.userId || "sandbox-default-user", email, displayName: matchedName };
    localStorage.setItem(mockUserKey, JSON.stringify(mockUser));
    window.dispatchEvent(new Event("storage"));
    return mockUser;
  }
};

export const logoutUser = async (): Promise<void> => {
  if (!isMockDb && authInstance) {
    await signOut(authInstance);
  } else {
    localStorage.removeItem(mockUserKey);
    window.dispatchEvent(new Event("storage"));
  }
};

// -------------------------------------------------------------
// FIRESTORE SERVICES & SECURE LOCAL STATE API PROXIES
// -------------------------------------------------------------

// 1. User Profiles
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isMockDb && dbInstance) {
    try {
      const snap = await getDoc(doc(dbInstance, "users", userId));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    }
  } else {
    const list = getLocal<UserProfile>("users");
    return list.find((u) => u.userId === userId) || null;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "users", profile.userId), profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.userId}`);
    }
  } else {
    const list = getLocal<UserProfile>("users");
    const rest = list.filter((u) => u.userId !== profile.userId);
    rest.push(profile);
    setLocal("users", rest);
  }
};

// 2. Generated Recipes
export const addRecipe = async (recipe: Recipe): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "recipes", recipe.recipeId), {
        ...recipe,
        createdAt: new Date().toISOString() // Or Timestamp/serverTimestamp in direct rule verification
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `recipes/${recipe.recipeId}`);
    }
  } else {
    const list = getLocal<Recipe>("recipes");
    list.push({ ...recipe, createdAt: new Date().toISOString() });
    setLocal("recipes", list);
  }
};

export const getAllRecipes = async (): Promise<Recipe[]> => {
  if (!isMockDb && dbInstance) {
    try {
      const q = query(collection(dbInstance, "recipes"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Recipe);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "recipes");
    }
  } else {
    return getLocal<Recipe>("recipes");
  }
};

// 3. Saved Favorites Recipes Relationships
export const saveRecipeToFavorites = async (userId: string, recipeId: string): Promise<void> => {
  const saveId = `saved-${userId}-${recipeId}`;
  const savedObj: SavedRecipe = {
    saveId,
    userId,
    recipeId,
    savedAt: new Date().toISOString()
  };

  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "savedRecipes", saveId), savedObj);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `savedRecipes/${saveId}`);
    }
  } else {
    const list = getLocal<SavedRecipe>("savedRecipes");
    if (!list.some((s) => s.saveId === saveId)) {
      list.push(savedObj);
      setLocal("savedRecipes", list);
    }
  }
};

export const removeRecipeFromFavorites = async (userId: string, recipeId: string): Promise<void> => {
  const saveId = `saved-${userId}-${recipeId}`;
  if (!isMockDb && dbInstance) {
    try {
      await deleteDoc(doc(dbInstance, "savedRecipes", saveId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `savedRecipes/${saveId}`);
    }
  } else {
    const list = getLocal<SavedRecipe>("savedRecipes");
    const updated = list.filter((s) => s.saveId !== saveId);
    setLocal("savedRecipes", updated);
  }
};

export const getSavedRecipesList = async (userId: string): Promise<SavedRecipe[]> => {
  if (!isMockDb && dbInstance) {
    try {
      const q = query(collection(dbInstance, "savedRecipes"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as SavedRecipe);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "savedRecipes");
    }
  } else {
    return getLocal<SavedRecipe>("savedRecipes").filter((s) => s.userId === userId);
  }
};

// 4. Meal Plans
export const createMealPlan = async (plan: MealPlan): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "mealPlans", plan.planId), plan);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `mealPlans/${plan.planId}`);
    }
  } else {
    const list = getLocal<MealPlan>("mealPlans");
    list.push(plan);
    setLocal("mealPlans", list);
  }
};

export const getMealPlans = async (userId: string): Promise<MealPlan[]> => {
  if (!isMockDb && dbInstance) {
    try {
      const q = query(collection(dbInstance, "mealPlans"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as MealPlan);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "mealPlans");
    }
  } else {
    return getLocal<MealPlan>("mealPlans").filter((m) => m.userId === userId);
  }
};

export const deleteMealPlan = async (planId: string): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await deleteDoc(doc(dbInstance, "mealPlans", planId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mealPlans/${planId}`);
    }
  } else {
    const list = getLocal<MealPlan>("mealPlans");
    setLocal("mealPlans", list.filter((m) => m.planId !== planId));
  }
};

// 5. Shopping Lists
export const createShoppingList = async (list: ShoppingListType): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "shoppingLists", list.listId), list);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `shoppingLists/${list.listId}`);
    }
  } else {
    const listStore = getLocal<ShoppingListType>("shoppingLists");
    listStore.push(list);
    setLocal("shoppingLists", listStore);
  }
};

export const getShoppingLists = async (userId: string): Promise<ShoppingListType[]> => {
  if (!isMockDb && dbInstance) {
    try {
      const q = query(collection(dbInstance, "shoppingLists"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ShoppingListType);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "shoppingLists");
    }
  } else {
    return getLocal<ShoppingListType>("shoppingLists").filter((l) => l.userId === userId);
  }
};

export const updateShoppingListDetails = async (listId: string, listData: ShoppingListType): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "shoppingLists", listId), listData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shoppingLists/${listId}`);
    }
  } else {
    const listStore = getLocal<ShoppingListType>("shoppingLists");
    const updated = listStore.map((l) => (l.listId === listId ? listData : l));
    setLocal("shoppingLists", updated);
  }
};

export const deleteShoppingListFromDb = async (listId: string): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await deleteDoc(doc(dbInstance, "shoppingLists", listId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `shoppingLists/${listId}`);
    }
  } else {
    const listStore = getLocal<ShoppingListType>("shoppingLists");
    setLocal("shoppingLists", listStore.filter((l) => l.listId !== listId));
  }
};

// 6. Chef Conversations History logger
export const saveChatMessage = async (msg: ChatMessage): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "chatHistory", msg.chatId), msg);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chatHistory/${msg.chatId}`);
    }
  } else {
    const list = getLocal<ChatMessage>("chatHistory");
    list.push(msg);
    setLocal("chatHistory", list);
  }
};

export const getChefChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  if (!isMockDb && dbInstance) {
    try {
      const q = query(collection(dbInstance, "chatHistory"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ChatMessage);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "chatHistory");
    }
  } else {
    return getLocal<ChatMessage>("chatHistory").filter((c) => c.userId === userId);
  }
};

export const clearChefChatHistoryInDb = async (userId: string): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      const q = query(collection(dbInstance, "chatHistory"), where("userId", "==", userId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(dbInstance, "chatHistory", d.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "chatHistory");
    }
  } else {
    const list = getLocal<ChatMessage>("chatHistory");
    setLocal("chatHistory", list.filter((c) => c.userId !== userId));
  }
};

// 7. Notes System attachable to recipes
export const addOrEditRecipeNote = async (note: Note): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await setDoc(doc(dbInstance, "notes", note.noteId), note);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notes/${note.noteId}`);
    }
  } else {
    const list = getLocal<Note>("notes");
    const updated = list.filter((n) => n.noteId !== note.noteId);
    updated.push(note);
    setLocal("notes", updated);
  }
};

export const getRecipeNotes = async (userId: string): Promise<Note[]> => {
  if (!isMockDb && dbInstance) {
    try {
      const q = query(collection(dbInstance, "notes"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Note);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "notes");
    }
  } else {
    return getLocal<Note>("notes").filter((n) => n.userId === userId);
  }
};

export const deleteRecipeNoteFromDb = async (noteId: string): Promise<void> => {
  if (!isMockDb && dbInstance) {
    try {
      await deleteDoc(doc(dbInstance, "notes", noteId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notes/${noteId}`);
    }
  } else {
    const list = getLocal<Note>("notes");
    setLocal("notes", list.filter((n) => n.noteId !== noteId));
  }
};
