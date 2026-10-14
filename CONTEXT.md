# BiteWise

Meal and ingredient tracking: users build Ingredients, compose them into Meals, and compose Meals into Meal plans.

## Language

### Identity

**User**:
A person with a BiteWise account, identified by their sign-in email, which is unique among non-deleted Users. Emails are stored lowercased; uniqueness ignores case and accents (`José@x.com` and `jose@x.com` are the same email). Deleting the account erases their Profile; the email may then sign up again as a new User.
_Avoid_: Account (for the person), member

**Profile**:
What a User says about themselves: personal information, social profiles, avatar, and Body stats. Never includes sign-in credentials.
_Avoid_: Settings (for the whole page), user details

**Email verification**:
Proof that a User controls their sign-in email: opening a single-use link mailed to it, valid for 24 hours, confirming an Email change, or signing in with Google when Google has verified that email. Requesting a new link invalidates earlier ones. Unverified Users can still sign in and use BiteWise, except uploading an avatar (it is publicly served). If a Google identity with a verified email is linked to an unverified User, that User's password and Sessions are dropped, since whoever set the password never proved they own the email.
_Avoid_: Confirmation, activation

**Email change**:
Replacing a User's sign-in email. The User re-enters their password (so a Google-only User can't), and the new address must not be in use. A confirm link goes to the new address and a cancel link to the old one, both valid for 24 hours; asking again replaces the pending change. Confirming swaps the email, completes Email verification, ends every other Session, and drops links mailed to the old address. Cancelling from the old address assumes the password is compromised: it clears the password and ends every Session, so the User sets a new one by Password reset. Cancelling in the app only drops the pending change. A linked Google identity stays linked.
_Avoid_: Email update, re-verification

**Password reset**:
Setting a new password by opening a single-use link mailed to the sign-in email, valid for 1 hour; only submitting the new password uses the link up. Since the link proves the User controls their sign-in email, it also completes Email verification, and a Google-only User can use it to set a first password. A reset ends every Session of the User and cancels a pending Email change. Asking for a link never reveals whether an account exists for the email.
_Avoid_: Forgot password (for the process), password recovery

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
