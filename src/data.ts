// Static lists and helpers for AI Recipe Generator

export interface IngredientOption {
  name: string;
  category: "Vegetables" | "Fruits" | "Grains" | "Dairy" | "Protein" | "Pantry";
}

export const POPULAR_INGREDIENTS: IngredientOption[] = [
  // Vegetables
  { name: "Potato", category: "Vegetables" },
  { name: "Tomato", category: "Vegetables" },
  { name: "Onion", category: "Vegetables" },
  { name: "Garlic", category: "Vegetables" },
  { name: "Ginger", category: "Vegetables" },
  { name: "Spinach", category: "Vegetables" },
  { name: "Bell Pepper", category: "Vegetables" },
  { name: "Carrot", category: "Vegetables" },
  { name: "Cauliflower", category: "Vegetables" },
  { name: "Lemon", category: "Vegetables" },
  // Fruits
  { name: "Apple", category: "Fruits" },
  { name: "Banana", category: "Fruits" },
  { name: "Orange", category: "Fruits" },
  { name: "Mango", category: "Fruits" },
  { name: "Strawberry", category: "Fruits" },
  // Grains
  { name: "Rice", category: "Grains" },
  { name: "Wheat Flour", category: "Grains" },
  { name: "Oats", category: "Grains" },
  { name: "Quinoa", category: "Grains" },
  { name: "Pasta", category: "Grains" },
  // Dairy
  { name: "Paneer", category: "Dairy" },
  { name: "Cheese", category: "Dairy" },
  { name: "Milk", category: "Dairy" },
  { name: "Yogurt", category: "Dairy" },
  { name: "Butter", category: "Dairy" },
  // Protein
  { name: "Chicken Breast", category: "Protein" },
  { name: "Egg", category: "Protein" },
  { name: "Tofu", category: "Protein" },
  { name: "Chickpeas", category: "Protein" },
  { name: "Lentils", category: "Protein" },
  { name: "Fish", category: "Protein" },
  // Pantry
  { name: "Olive Oil", category: "Pantry" },
  { name: "Soy Sauce", category: "Pantry" },
  { name: "Coconut Milk", category: "Pantry" },
  { name: "Honey", category: "Pantry" },
  { name: "Chili Powder", category: "Pantry" },
  { name: "Turmeric", category: "Pantry" }
];

export const CUISINES_LIST = [
  "Global/Any",
  "Indian",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Thai",
  "Mediterranean",
  "French",
  "Korean"
];

export const DIET_TYPES = [
  "Standard/None",
  "Vegetarian",
  "Vegan",
  "Keto",
  "High Protein",
  "Low Carb",
  "Gluten Free"
];

export const REGIONAL_INDIAN_STATES = [
  "Uttar Pradesh",
  "Punjab",
  "Rajasthan",
  "Gujarat",
  "Maharashtra",
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Bihar",
  "West Bengal"
];

export const REGIONAL_INTERNATIONAL = [
  "Italian",
  "Chinese",
  "Japanese",
  "Mexican",
  "Thai",
  "French",
  "Korean",
  "Mediterranean"
];

export interface FestivalInfo {
  name: string;
  culturalBackground: string;
}

export const FESTIVALS_LIST: FestivalInfo[] = [
  {
    name: "Diwali",
    culturalBackground: "The Festival of Lights, celebrating the victory of light over darkness and knowledge over ignorance. Traditional sweets and rich, savory deep-fried snacks are prepared to share with guests."
  },
  {
    name: "Holi",
    culturalBackground: "The Festival of Colors, welcoming Spring and symbolizing peace and love. Famous delicacies include dynamic sweet dumplings (Gujiya), lentil fritters (Dahi Vada), and spiced milk beverages (Thandai)."
  },
  {
    name: "Eid",
    culturalBackground: "Marks festive endings of fasting and self-reflection (Ramadan). Traditional favorites are luxurious sheermal breads, slow-cooked kormas, mutton biryanis, and milk vermicelli pudding (Sheer Khurma)."
  },
  {
    name: "Christmas",
    culturalBackground: "Celebrating joy and winter togetherness. Associated with traditional plum cake baking, elegant panettone yeast breads, spiced eggnogs, roasted vegetables, and hearty centerpieces."
  },
  {
    name: "Navratri",
    culturalBackground: "Dedicated to the nine forms of Goddess Durga. Focused on purifying satvik vegetarian ingredients: fasting grains (buckwheat, water chestnut flour, sago), rock salt, potatoes, and peanuts."
  },
  {
    name: "Raksha Bandhan",
    culturalBackground: "Honoring sibling bonds. Family feasts focus heavily on sweet saffron kheer puddings, traditional milk-cake fudges, dynamic savories, and warm, fluffy parathas."
  },
  {
    name: "Pongal",
    culturalBackground: "Harvest festival of South India. Traditional recipe includes boiling freshly harvested rice with milk and jaggery in a decorated clay pot until overflow, symbolizing abundant prosperity."
  },
  {
    name: "Onam",
    culturalBackground: "Harvest festival of Kerala celebrated with the iconic grand feast 'Onasadya'. Featuring more than 26 distinct plantain leaf-served curries, aviyal stews, and banana molasses fritters."
  },
  {
    name: "Baisakhi",
    culturalBackground: "Spring harvest festival of Punjab marking solar new year. Feasted with dynamic tandoori options, high-energy spiced chickpea curries (Chole) with fluffy bhaturas, and yellow sweet saffron rice."
  }
];
