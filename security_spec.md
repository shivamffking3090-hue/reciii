# Security Specification & Test-Driven Rules for AI Recipe Generator

## 1. Data Invariants
- **User Ownership**: A user profile, saved recipes, meal plans, shopping lists, chat history, and notes can only be written (create/update/delete) by the owner whose `uid` matches the `userId` of the document or path block.
- **Reference Integrity**: A saved recipe or note must refer to a valid `recipeId`.
- **Temporal Integrity**: All creations/updates must use synchronous server timestamps (`request.time`).
- **No Self-Privilege Escalation**: Users cannot declare themselves admins. Admins can only be registered securely by checking the `/admins/{userId}` document.
- **Immutable Fields**: `userId`, `recipeId`, and `createdAt` must be immutable.

## 2. The "Dirty Dozen" Malicious Payloads
The following payloads will be blocked by our rules:

1. **Self-Appointed Admin**: A user trying to create an admin profile under `/admins` or setting `isAdmin: true` in user preferences.
2. **PII Data Scraping**: A user trying to read other users' profile documents/preferences under `/users`.
3. **Recipe Spoofing**: User A trying to save a recipe on behalf of User B by altering the `userId` in `savedRecipes`.
4. **Timestamp Bypass**: Creating a recipe with a client-supplied date in the future instead of using `request.time`.
5. **No-ID Poisoning**: Injecting an excessively large or malformed string (e.g. 1.5KB invalid characters) as a document ID.
6. **Ghost Updates**: Updating a saved recipe to add a hidden field (`isPremiumApproved: true`).
7. **Meal Plan Manipulation**: User B editing User A's workout/meal planning details.
8. **Orphan Notes**: Creating notes referencing a non-existent recipe or another user's private recipe.
9. **Chat History Injection**: Modifying previous AI Chef conversations or adding chat histories with another user's ID.
10. **System Field Poisoning**: Bypassing server validation to directly write AI tips onto a shared recipe.
11. **Negative Servings**: Submitting a recipe with negative servings or empty ingredients list.
12. **Blanket Read Request**: Requesting a list of all shopping lists without narrowing down the query to `userId == request.auth.uid`.

## 3. Test Runner Specification (`firestore.rules.test.ts`)
We will verify that these malicious attempts are strictly rejected by the ruleset. All standard user flows will be successfully allowed.
