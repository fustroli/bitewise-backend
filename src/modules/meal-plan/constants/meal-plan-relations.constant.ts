export const MEAL_PLAN_RELATIONS = {
  user: true,
  mealPlanMeals: {
    meal: {
      mealIngredients: {
        ingredient: true,
      },
    },
  },
};
