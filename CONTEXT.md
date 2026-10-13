# BiteWise

Meal and ingredient tracking: users build Ingredients, compose them into Meals, and compose Meals into Meal plans.

## Language

### Identity

**User**:
A person with a BiteWise account, identified by their sign-in email, which is unique among non-deleted Users. Deleting the account erases their Profile; the email may then sign up again as a new User.
_Avoid_: Account (for the person), member

**Profile**:
What a User says about themselves: personal information, social profiles, avatar, Body stats, and Notification settings. Never includes sign-in credentials.
_Avoid_: Settings (for the whole page), user details

**Notification settings**:
Which kinds of email a User receives, and the default email address they are sent to (the sign-in email unless changed).

**Email verification**:
Proof that a User controls their sign-in email: opening a single-use link mailed to it, valid for 24 hours, or signing in with Google when Google has verified that email. Requesting a new link invalidates earlier ones. Unverified Users can still sign in and use BiteWise. If a Google identity with a verified email is linked to an unverified User, that User's password and Sessions are dropped, since whoever set the password never proved they own the email.
_Avoid_: Confirmation, activation

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
A food item with nutritional values, defined by its Owner. Cannot be deleted while any Meal uses it.

**Meal**:
A named combination of one or more Meal ingredients, each for a distinct Ingredient with the same Owner. Cannot be deleted while any Meal plan contains it.
_Avoid_: Dish

**Meal ingredient**:
An Ingredient used in a Meal, together with a quantity.
_Avoid_: Line item, component

**Meal plan**:
A named set of one or more distinct Meals with the same Owner.
_Avoid_: Diet, schedule

### Body

**Body stats**:
A User's sex, height, weight, Activity level and tape measurements (neck, waist, hip) as currently recorded (metric, no history). Part of their Profile. Nothing derived from them (e.g. body fat percentage) is stored.
_Avoid_: Body metrics, biometrics, health data

**Activity level**:
How physically active a User is day to day: one of six steps from Sedentary to Extra active.
_Avoid_: Exercise level, lifestyle
