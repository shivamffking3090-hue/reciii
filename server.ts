import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization pattern to avoid crashing if GEMINI_API_KEY is not defined immediately.
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// -------------------------------------------------------------
// SECURE SERVER-SIDE GEMINI API ENDPOINTS
// -------------------------------------------------------------

// 1. Generate Recipe (Main generator, Regional, Festival, Leftovers, Smart Fridge)
app.post("/api/recipes/generate", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const {
      ingredients,
      cuisine,
      dietType,
      cookingTime,
      difficulty,
      servings,
      language,
      isLeftoverMode,
      targetLeftovers,
      isFridgeMode,
      festivalName,
      regionalState
    } = req.body;

    let prompt = `Generate a high-quality recipe. Use responseSchema. `;

    if (isLeftoverMode) {
      prompt += `Special Focus: Leftover Recipe mode. Minimize food waste! Main leftover ingredients or items to repurpose: ${JSON.stringify(targetLeftovers || ingredients)}. Make a delicious recipe incorporating these leftovers creatively. `;
    } else if (isFridgeMode) {
      prompt += `Special Focus: Smart Fridge Mode. Strictly use ONLY (or dominantly) the following designated available ingredients: ${ingredients}. `;
    } else if (festivalName) {
      prompt += `Special Focus: Traditional Festival Recipe for "${festivalName}". In the description or instructions, highlight the cultural significance of this festival and deep traditional background of this food. `;
    } else if (regionalState) {
      prompt += `Special Focus: Regional culinary heritage of ${regionalState}. Incorporate traditional methods and flavor profiles representative of this region. `;
    }

    prompt += `Details:
- Ingredients list: ${ingredients || "any gourmet match"}
- Preferred Cuisine Style: ${cuisine || "any"}
- Dietary preferences/Diet: ${dietType || "Standard/None"}
- Target Cooking Duration: ${cookingTime || "Any"}
- Skill level: ${difficulty || "Beginner"}
- Number of servings: ${servings || "4"}
- Output response Language representation: ${language || "English"}. You MUST strictly translate the recipe content, titles, and step-by-step instructions into ${language || "English"}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "title",
            "description",
            "ingredients",
            "measurements",
            "prepTime",
            "cookingTime",
            "totalTime",
            "difficulty",
            "instructions",
            "nutritionSummary",
            "healthyTips",
            "servingSuggestions"
          ],
          properties: {
            title: { type: Type.STRING, description: "Name of the culinary recipe" },
            description: { type: Type.STRING, description: "Elegant description of flavor profiles, cultural background or leftover saving values" },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of items / ingredients"
            },
            measurements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Corresponding precise measurements or quantities matching ingredients"
            },
            prepTime: { type: Type.STRING, description: "Preparation time, e.g. '15 mins'" },
            cookingTime: { type: Type.STRING, description: "Cooking time, e.g. '30 mins'" },
            totalTime: { type: Type.STRING, description: "Total duration, e.g. '45 mins'" },
            difficulty: { type: Type.STRING, description: "Difficulty category" },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Clear, sequential cooking steps, strictly in target language"
            },
            nutritionSummary: {
              type: Type.OBJECT,
              description: "Visual macronutrient estimation per serving",
              required: ["calories", "protein", "carbs", "fat", "fiber"],
              properties: {
                calories: { type: Type.STRING, description: "Calories, e.g. '350 kcal'" },
                protein: { type: Type.STRING, description: "Protein in grams" },
                carbs: { type: Type.STRING, description: "Carbohydrates in grams" },
                fat: { type: Type.STRING, description: "Fat representation" },
                fiber: { type: Type.STRING, description: "Fiber representation" }
              }
            },
            healthyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Healthy ingredient alternatives or modifications"
            },
            servingSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Food pairing suggestions, sides, desserts or matching drinks"
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Recipe Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate recipe" });
  }
});

// 2. Chat with AI Chef Assistant
app.post("/api/chef/chat", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { message, history } = req.body;

    const chatInstance = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: "You are Chef Antoinette, a friendly, gourmet Michelin-star Executive Chef. Assist users with professional cooking guidance, ingredient substitutions, smart food pairing, diagnostic troubleshooting (e.g., 'too salty', 'sauce split'), or quick beginner advice. Be motivating, passionate, and structured. Always respond concisely in clean markdown."
      }
    });

    // Send history context if present to continue conversation
    // Wait, the SDK chat object handles current conversation within state but since HTTP is stateless,
    // we can either pass a system-defined multi-turn prompt context, or build the prompt manually
    // which is extremely robust. Let's send the message with history context.
    let fullPrompt = "";
    if (history && history.length > 0) {
      fullPrompt = "Below is our conversation history:\n" + history.map((h: any) => `${h.role === 'user' ? 'Guest' : 'Chef'}: ${h.text}`).join("\n") + `\n\nGuest current message: ${message}\nChef:`;
    } else {
      fullPrompt = message;
    }

    const response = await chatInstance.sendMessage({ message: fullPrompt });
    res.json({ response: response.text });
  } catch (error: any) {
    console.error("AI Chef Error:", error);
    res.status(500).json({ error: error.message || "Failed to chat with AI Chef" });
  }
});

// 3. Meal Plan Generator
app.post("/api/mealplanner/generate", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { dietPreference, targetCalories, goals, cuisinePreference, planDuration } = req.body;

    let durationText = planDuration || "Weekly";

    const prompt = `Generate a structured visual meal plan. Plan Duration: ${durationText}.
Preferences:
- Diet preference: ${dietPreference || "Balanced/Any"}
- Daily target calories: ${targetCalories || "2000"} kcal
- Fitness goals: ${goals || "General health"}
- Preferred Cuisines: ${cuisinePreference || "Diverse/Global"}

Strictly return a valid JSON matching the responseSchema mapping Breakfast, Lunch, Dinner, and Snacks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["planTitle", "nutritionGoalSummary", "days"],
          properties: {
            planTitle: { type: Type.STRING, description: "E.g. Personalized Weekly Energy Diet Plan" },
            nutritionGoalSummary: { type: Type.STRING, description: "High-level guidance on calories and macros" },
            days: {
              type: Type.ARRAY,
              description: "Array of days with planned meals",
              items: {
                type: Type.OBJECT,
                required: ["dayName", "meals"],
                properties: {
                  dayName: { type: Type.STRING, description: "E.g., Monday, Day 1" },
                  meals: {
                    type: Type.OBJECT,
                    required: ["breakfast", "lunch", "dinner", "snacks"],
                    properties: {
                      breakfast: {
                        type: Type.OBJECT,
                        required: ["name", "calories", "notes"],
                        properties: {
                          name: { type: Type.STRING },
                          calories: { type: Type.STRING },
                          notes: { type: Type.STRING }
                        }
                      },
                      lunch: {
                        type: Type.OBJECT,
                        required: ["name", "calories", "notes"],
                        properties: {
                          name: { type: Type.STRING },
                          calories: { type: Type.STRING },
                          notes: { type: Type.STRING }
                        }
                      },
                      dinner: {
                        type: Type.OBJECT,
                        required: ["name", "calories", "notes"],
                        properties: {
                          name: { type: Type.STRING },
                          calories: { type: Type.STRING },
                          notes: { type: Type.STRING }
                        }
                      },
                      snacks: {
                        type: Type.OBJECT,
                        required: ["name", "calories", "notes"],
                        properties: {
                          name: { type: Type.STRING },
                          calories: { type: Type.STRING },
                          notes: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Meal Planner Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate meal plan" });
  }
});

// 4. Shopping List Generator from plan/recipes
app.post("/api/shoppinglist/generate", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { recipesList, mealPlan } = req.body;

    const prompt = `Consolidate, calculate approximate volume details, and categorize a comprehensive shopping list of grocery items needed for these ingredients or meals:
Recipes list: ${JSON.stringify(recipesList || [])}
Meal Plan Details: ${JSON.stringify(mealPlan || {})}

Return a structured items array grouped by supermarket categories (Produce, Dairy, Pantry/Spices, Meat/Protein, Others).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "categories"],
          properties: {
            title: { type: Type.STRING, description: "Descriptive name of the list" },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["categoryName", "items"],
                properties: {
                  categoryName: { type: Type.STRING, description: "E.g., Produce, Dairy" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["name", "quantity", "isChecked"],
                      properties: {
                        name: { type: Type.STRING, description: "E.g. Fresh Tomatoes" },
                        quantity: { type: Type.STRING, description: "E.g. 500g or 3 units" },
                        isChecked: { type: Type.BOOLEAN, description: "Default false" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Shopping List Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate shopping list" });
  }
});


// 5. Nutrition Analyzer Estimator
app.post("/api/nutrition/analyze", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { ingredientsText, recipeName } = req.body;

    const prompt = `Perform a nutritional breakdown analysis.
Recipe Context: ${recipeName || "Custom Combination"}
Ingredients Context: ${ingredientsText}

Provide calories, carbohydrates, protein, fat, fiber estimates in a cleanly structured JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["estimatedServings", "totalCalories", "proteinG", "carbsG", "fatG", "fiberG", "macronutrientSummary", "healthRatingNotes"],
          properties: {
            estimatedServings: { type: Type.NUMBER, description: "Servings count" },
            totalCalories: { type: Type.NUMBER, description: "E.g. 450" },
            proteinG: { type: Type.NUMBER, description: "Grams of protein" },
            carbsG: { type: Type.NUMBER, description: "Grams of carbohydrates" },
            fatG: { type: Type.NUMBER, description: "Grams of fat" },
            fiberG: { type: Type.NUMBER, description: "Grams of fiber" },
            macronutrientSummary: { type: Type.STRING, description: "Brief high level split review" },
            healthRatingNotes: { type: Type.STRING, description: "E.g. High fiber, good post-workout option" }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Nutrition Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze nutrition" });
  }
});

// -------------------------------------------------------------
// VITE SETUP MATCHES PRODUCTION REVIEWS
// -------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

bootstrap();
