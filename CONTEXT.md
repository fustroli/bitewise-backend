# BiteWise

Meal and ingredient tracking: users build Ingredients, compose them into Meals, and compose Meals into Meal plans.

## Language

### Identity

**Session**:
The period during which a User is signed in on one device. It starts at sign-in and ends at sign-out, account deletion, or when its refresh token is rejected; a User may have several Sessions at once.
_Avoid_: Login (as a noun), auth, token

### Ownership

**Owner**:
The User an Owned resource belongs to; always the authenticated User who created it, never chosen by the client.
_Avoid_: creator, author

**Owned resource**:
An Ingredient, Meal or Meal plan. Visible and mutable only by its Owner; to anyone else it does not exist. Its name is unique among the Owner's non-deleted resources of the same kind.
_Avoid_: user resource, private entity

### Composition

**Ingredient**:
A food item with nutritional values, defined by its Owner.

**Meal**:
A named set of Ingredients, each with a quantity. A Meal may only use Ingredients with the same Owner.

**Meal plan**:
A named set of Meals. A Meal plan may only contain Meals with the same Owner.
