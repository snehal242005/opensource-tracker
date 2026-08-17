# OpenSource Hub

A web platform where students track their open source Pull Requests through
stages, get mentor feedback, and stay motivated with points/badges.

This repo currently implements **Phase 1 (Foundation)**, **Phase 2 (GitHub
Auto-Sync)**, and **Phase 3 (Mentor Feedback + Notifications)**:

- Firebase email/password auth with three roles: Student, Mentor, Admin
- FastAPI backend that verifies Firebase ID tokens and exposes CRUD endpoints
  for a `pull_requests` collection
- React (Vite) frontend with signup/login, a student dashboard (list + add
  PR), and a mentor/admin dashboard
- Students can connect their GitHub account (OAuth) and sync their pull
  requests automatically — synced PRs are mapped onto the same 8-stage
  pipeline as manually-added ones and visually labeled "GitHub sync"
- Mentors/admins can open a PR and leave feedback (a comment plus an
  approve/request-changes/comment recommendation); the student can reply
  in-thread, and gets an in-app notification when new feedback arrives
- Students pick a mentor by name from a dropdown at signup (along with roll
  number, college, and year); a mentor's dashboard only ever shows the
  students who picked them, grouped by student — not the whole program roster

Admins are still unscoped (they see every student, same as before) since
per-admin assignment isn't a concept here — an admin oversees the whole
program. Gamification and AI features are **not** built yet.

## Project structure

```
opensource-tracker/
├── backend/            FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py            env-driven settings (GitHub OAuth, etc.)
│   │   ├── crypto_utils.py      encrypt/decrypt stored GitHub tokens
│   │   ├── github_client.py     thin GitHub REST API client (httpx)
│   │   ├── stage_mapping.py     GitHub PR state -> 8-stage enum
│   │   ├── firebase_config.py
│   │   ├── dependencies.py
│   │   ├── models.py
│   │   └── routers/
│   │       ├── auth.py            /auth/github/login, /auth/github/callback
│   │       ├── pull_requests.py   CRUD + /pull_requests/sync
│   │       ├── feedback.py        POST /feedback, GET /feedback/pr/{pr_id}
│   │       ├── notifications.py   GET /notifications, POST /notifications/mark_read
│   │       ├── users.py           GET /users (mentor/admin only, scoped to own students for mentors)
│   │       └── mentors.py         GET /mentors (public -- signup mentor dropdown)
│   ├── requirements.txt
│   ├── firebase-admin-key.example.json   (template, tracked)
│   ├── firebase-admin-key.json           (your real key, git-ignored)
│   ├── .env.example     (template, tracked)
│   └── .env             (your real GitHub OAuth config, git-ignored)
├── frontend/           React + Vite app
│   ├── src/
│   ├── .env.example    (template, tracked)
│   └── .env            (your real config, git-ignored)
└── firestore.rules     Firestore security rules to paste into the console
```

## 1. Create your Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   create a new project (Spark/free plan is fine).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database (start in production mode; the
   security rules below will lock it down correctly).
4. **Project settings → General** → under "Your apps", add a **Web app** and
   copy the `firebaseConfig` values (apiKey, authDomain, projectId,
   storageBucket, messagingSenderId, appId).
5. **Project settings → Service accounts** → **Generate new private key**.
   This downloads a JSON file — that's your Admin SDK credential.

## 2. Configure the frontend

```
cd frontend
cp .env.example .env
```

Open `frontend/.env` and fill in the six `VITE_FIREBASE_*` values from step
1.4 above. `VITE_API_BASE_URL` should point at wherever you run the backend
(default `http://localhost:8001` — see the port note in step 6 below).

`.env` is git-ignored, so your real keys never get committed.

## 3. Configure the backend

Take the JSON file you downloaded in step 1.5 and save it as:

```
backend/firebase-admin-key.json
```

(This exact path is git-ignored. `backend/firebase-admin-key.example.json`
in the repo shows the expected shape.)

If this file is missing or invalid, the backend still starts up, but any
request that needs Firebase (auth, Firestore) returns a `500` error with a
clear message telling you to add the real key — it won't crash the whole app.

**Deploying (e.g. Render):** hosts that don't support uploading a file let
you set a `FIREBASE_ADMIN_KEY_JSON` environment variable instead, containing
the full contents of the same JSON key. `firebase_config.py` checks this env
var first and only falls back to reading `firebase-admin-key.json` off disk
if it's unset — so locally (no env var set) nothing changes, and in
production you never need the file at all.

`backend/runtime.txt` pins the Python version Render builds with
(`python-3.12.10`, matching local dev) so it doesn't default to a newer
Python that lacks prebuilt wheels for pinned deps like `pydantic-core`
(compiling those from source fails on Render's build filesystem). This file
is only read by Render's build system — it has no effect on `venv`/`uvicorn`
locally.

## 4. Configure GitHub OAuth (for auto-sync)

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth
   App** (for a personal account) at
   https://github.com/settings/developers.
2. Fill in:
   - **Application name**: anything, e.g. `OpenSource Hub (local)`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:8001/auth/github/callback`
3. Click **Register application**, then **Generate a new client secret**.
   Copy the **Client ID** and the **Client secret**.
4. Create `backend/.env` from the template:

   ```
   cd backend
   cp .env.example .env
   ```

5. Fill in `backend/.env`:

   | Key                     | Value                                                          |
   |--------------------------|-----------------------------------------------------------------|
   | `GITHUB_CLIENT_ID`       | from step 3                                                     |
   | `GITHUB_CLIENT_SECRET`   | from step 3                                                     |
   | `GITHUB_CALLBACK_URL`    | `http://localhost:8001/auth/github/callback` (must exactly match the OAuth App's callback URL) |
   | `FRONTEND_URL`           | `http://localhost:5173` — where the backend redirects back to after OAuth completes |
   | `TOKEN_ENCRYPTION_KEY`   | a Fernet key used to encrypt stored GitHub tokens at rest — generate one with the command below |

   Generate `TOKEN_ENCRYPTION_KEY`:

   ```
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

   `backend/.env` is git-ignored, same as `frontend/.env` — your client
   secret and encryption key never get committed.

   **Important**: these are backend-only secrets. Do not put them in
   `frontend/.env` — anything there ships to the browser bundle if ever
   referenced from frontend code, and `GITHUB_CLIENT_SECRET` in particular
   must never be exposed client-side.

## 5. Install dependencies

**Backend:**

```
cd backend
python -m venv venv
venv\Scripts\activate        # on Windows
# source venv/bin/activate   # on macOS/Linux
pip install -r requirements.txt
```

**Frontend:**

```
cd frontend
npm install
```

## 6. Run both servers locally

**Backend** (from `backend/`, with the venv activated):

```
uvicorn app.main:app --reload --port 8001
```

Run this from the `backend/` folder itself, and note it's `app.main:app`
(pointing at `app/main.py`), not `main:app` — `uvicorn main:app` will fail
with "Could not import module 'main'" since there's no `main.py` at the
`backend/` top level.

The port (`8001` here) is just a flag to `uvicorn` — pick any free port and
update `VITE_API_BASE_URL` in `frontend/.env` to match. Port `8000` is
sometimes blocked or reserved on Windows (`WinError 10013`), typically by
Hyper-V's dynamic port exclusion range or another process already bound to
it; `8001` (or any other free port) works the same way.

API docs at http://localhost:8001/docs. Check http://localhost:8001/health —
`firebase_configured` should be `true` once your admin key is in place.

**Frontend** (from `frontend/`):

```
npm run dev
```

App at http://localhost:5173.

## 7. Firestore security rules

Copy the contents of [`firestore.rules`](firestore.rules) at the repo root
into **Firebase Console → Firestore Database → Rules**, then click Publish.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function myRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    match /users/{uid} {
      allow read: if isSignedIn() && (
        request.auth.uid == uid ||
        (myRole() == 'mentor' && resource.data.role == 'student' && resource.data.mentor_id == request.auth.uid)
      );
      allow create: if isSignedIn() && request.auth.uid == uid;
      allow update: if isSignedIn() && request.auth.uid == uid
                    && request.resource.data.role == resource.data.role;
      allow delete: if false;
    }

    match /pull_requests/{prId} {
      allow read: if isSignedIn() && (
        resource.data.student_id == request.auth.uid ||
        myRole() in ['mentor', 'admin']
      );
      allow create: if isSignedIn()
                    && request.resource.data.student_id == request.auth.uid
                    && myRole() == 'student';
      allow update, delete: if isSignedIn() && resource.data.student_id == request.auth.uid;
    }

    match /feedback/{feedbackId} {
      allow read: if isSignedIn() && (
        resource.data.student_id == request.auth.uid ||
        myRole() in ['mentor', 'admin']
      );
      allow create: if isSignedIn() && (
        (myRole() in ['mentor', 'admin'] && request.resource.data.author_id == request.auth.uid)
        ||
        (myRole() == 'student'
          && request.resource.data.author_id == request.auth.uid
          && request.resource.data.parent_id != null
          && get(/databases/$(database)/documents/pull_requests/$(request.resource.data.pr_id)).data.student_id == request.auth.uid)
      );
      allow update, delete: if false;
    }

    match /notifications/{notificationId} {
      allow read: if isSignedIn() && resource.data.user_id == request.auth.uid;
      allow update: if isSignedIn() && resource.data.user_id == request.auth.uid
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      allow create, delete: if false;
    }

    match /github_tokens/{uid} {
      allow read, write: if false;
    }

    match /oauth_states/{state} {
      allow read, write: if false;
    }
  }
}
```

These rules mean: everyone can only ever read/write their own `users` doc
(and can't change their own role after signup); a mentor can additionally
read a student's doc if that student picked them as mentor
(`mentor_id == the mentor's own uid`), but no other student's. Students can
only create and manage their own PRs, and mentors/admins can read every PR
(PR-level scoping for mentors — only their own students' PRs — is enforced
by the backend, not these rules; see "How mentor-student mapping works"
below). On `feedback`,
mentors/admins can open a new thread, the involved student can only reply
(never start a fresh, non-reply entry) and nobody can edit or delete a
feedback entry once posted. On `notifications`, a user can read their own
notifications and flip `read` on their own docs (that's all opening the bell
dropdown does), but only the backend can create or delete one. `github_tokens`
and `oauth_states` are denied to the client SDK entirely — only the backend
(Admin SDK) ever touches them. The FastAPI backend uses the Admin SDK, which
bypasses these rules entirely (it's trusted server-side code) and does its
own permission checks on top — see "How mentor feedback + notifications
work" below for those checks.

## How auth + roles work

1. On the frontend, signup calls Firebase Auth's
   `createUserWithEmailAndPassword`, then writes a matching profile document
   directly to Firestore at `users/{uid}`: `{ uid, name, email, role,
   created_at }`, plus `{ roll_number, college_name, year, mentor_id }` when
   `role == "student"` (see "How mentor-student mapping works" below).
2. On login, the frontend reads that Firestore doc to know the user's role
   and redirects: `student` → `/dashboard`, `mentor`/`admin` → `/staff`.
3. For backend API calls, the frontend attaches the user's Firebase ID token
   as `Authorization: Bearer <token>`. The backend verifies the token with
   the Admin SDK, looks up the caller's role in Firestore, and enforces
   permissions (e.g. only students can create PRs; only the owning student or
   an admin can delete one).

## How mentor-student mapping works

### Why a public `/mentors` endpoint

At signup, a student picks their mentor from a dropdown of existing mentors
— but that dropdown has to be populated *before* the "Sign Up" button is
clicked, i.e. before `createUserWithEmailAndPassword` has run and before the
student has a Firebase ID token. Every other read in this app goes through
an authenticated endpoint, but there's no account yet to authenticate with
at this point in the flow, so `GET /mentors` (`backend/app/routers/mentors.py`)
is deliberately left with no auth dependency and returns only non-sensitive
fields (`uid`, `name`, `email`) — a minimal public mentor directory, not a
general-purpose user listing. If the list comes back empty (no mentors have
signed up yet), the dropdown shows "No mentors available yet" instead of a
broken/empty `<select>`; the signup form still submits fine with no
`mentor_id`, and the student can be assigned a mentor later by editing their
Firestore doc directly until an admin flow for that exists.

### Storing the relationship

The student's chosen mentor is stored as `mentor_id` (the mentor's Firebase
`uid`, not their name) on the student's own `users/{uid}` doc — a real
reference rather than a display string, so it stays correct even if the
mentor later changes their name. `roll_number`, `college_name`, and `year`
are stored alongside it, all written once at signup by
`AuthContext.jsx`'s `signup()`.

### Scoping mentors to their own students

Both `GET /pull_requests` and `GET /users` now branch on the caller's role:

- **student** — unchanged: only their own PRs.
- **mentor** — first queries `users` for `role == "student" && mentor_id ==
  <the mentor's uid>` to get their assigned student IDs, then queries
  `pull_requests` for `student_id in <those ids>` (chunked into groups of 30,
  Firestore's limit for an `in` query, in case a mentor ever has more
  students than that). `GET /users` does the same first query directly.
- **admin** — unchanged: everything, unscoped. There's no per-admin
  assignment concept here; an admin oversees the whole program, matching how
  `pull_requests` and `feedback` rules already treat `admin` the same as an
  unrestricted `mentor`.

The mentor dashboard (`MentorDashboard.jsx`) fetches both in parallel, then
groups PRs client-side by `student_id` and renders one collapsible
`StudentGroup` card per assigned student (name, roll number, college, year,
PR count) — including students with zero PRs yet, so a mentor can see their
whole roster, not just students who've already registered a PR.

### Firestore rules

The `users/{uid}` rule's `read` clause was extended so a mentor can read a
student's profile doc directly if `resource.data.mentor_id == request.auth.uid`
— mirroring the backend's scoping as a client-rule safety net, the same way
`pull_requests`'s rule already grants `mentor`/`admin` broad read access even
though the backend does its own filtering on top. A mentor still can't read
any *other* student's doc (one they're not assigned to), or the full user
list — that full-roster capability only exists server-side, gated by
`require_role("mentor", "admin")` plus the query-time filter above.

## How GitHub sync works

### The OAuth flow

GitHub's OAuth flow is a browser redirect dance, which doesn't carry our
Firebase `Authorization` header — so the tricky part is reliably tying the
callback back to the right Firestore user. Here's how it works end to end:

1. The student clicks **Connect GitHub** on the dashboard. The frontend
   calls `GET /auth/github/login` with their Firebase ID token (a normal
   authenticated `fetch`, not a page navigation yet).
2. The backend verifies the token, mints a random one-time `state` value,
   and stores `{state -> uid}` in a short-lived Firestore doc
   (`oauth_states/{state}`, 10-minute TTL). It returns GitHub's authorize URL
   (including that `state`) as JSON.
3. The frontend does `window.location.href = authorize_url` — a real page
   navigation to GitHub, since this step has to happen in the top-level
   browser window for GitHub's consent screen to work.
4. The student approves access on GitHub. GitHub redirects the browser to
   `GITHUB_CALLBACK_URL` (`/auth/github/callback`) with a `code` and the same
   `state`.
5. The backend looks up `state` in `oauth_states` to recover the `uid` (and
   deletes it — one-time use, which combined with the TTL check is what
   makes `state` an effective CSRF guard: a forged callback can't reuse or
   guess a valid state). It exchanges `code` for an access token via
   GitHub's token endpoint, fetches the student's GitHub username, encrypts
   and stores the token, and marks `users/{uid}.github_connected = true`.
6. The backend redirects the browser back to
   `FRONTEND_URL/dashboard?github=connected` (or `...=error` on failure). The
   dashboard reads that query param once, shows a banner, and strips it from
   the URL.

### Scopes requested

Only **`read:user`** — just enough to reliably resolve the student's GitHub
username after they authorize. We deliberately do **not** request `repo`
(full read/write access to private repos) or `public_repo` (write access to
public repos). PR data is fetched entirely through GitHub's public
[Search API](https://docs.github.com/en/rest/search/search#search-issues-and-pull-requests),
which needs no special scope — an authenticated request (even with a
scope-less token) just gets a much higher rate limit (5,000/hour vs.
60/hour unauthenticated) than the underlying data access. Net effect: this
app can never read a private repo or write anything on the student's behalf,
even if the stored token were somehow leaked.

### Where the token is stored

The GitHub access token is encrypted (Fernet/AES, via the `cryptography`
library) with a key from `TOKEN_ENCRYPTION_KEY` in `backend/.env`, and saved
in its own Firestore collection, `github_tokens/{uid}`, which Firestore
rules deny to the client SDK entirely (see `firestore.rules`) — only the
backend's Admin SDK can read it. The `users/{uid}` doc that the frontend
*does* read directly only ever gets non-sensitive fields:
`github_connected`, `github_username`, `github_connected_at`,
`last_synced_at`. The encrypted token itself never reaches the browser.

Encryption is symmetric (one key decrypts what it encrypts), which is a
deliberate simplification for a student project — a production system would
likely use per-tenant keys or a managed secrets service (e.g. GCP Secret
Manager / KMS) so a single leaked key can't decrypt every stored token.

### Sync Now → GitHub → 8-stage mapping

Clicking **Sync Now** (or connecting for the first time) calls
`POST /pull_requests/sync`, which:

1. Decrypts the student's stored token and looks up their GitHub username.
2. Calls the Search API for `author:{username} type:pr`, most-recently
   updated first, capped at the 30 most recent PRs per sync
   (`MAX_PRS_PER_SYNC` in `backend/app/github_client.py`) to keep each sync
   fast and well inside GitHub's rate limits — click Sync Now again later to
   pick up anything older that's since changed.
3. For each PR, fetches its detail (state, `merged`, requested reviewers)
   and its reviews, then maps them onto our 8-stage enum:

   | GitHub state                                                        | Our stage           |
   |-----------------------------------------------------------------------|----------------------|
   | Closed, `merged: true`                                                | `Merged`             |
   | Closed, `merged: false`                                               | `Closed/Rejected`    |
   | Open, no reviews yet, has requested reviewers                        | `Under Review`       |
   | Open, no reviews yet, no requested reviewers                         | `PR Raised`          |
   | Open, most recent review per reviewer includes `CHANGES_REQUESTED`, no commit pushed since | `Changes Requested`  |
   | Open, `CHANGES_REQUESTED` as above, **but** a commit was pushed after that review | `Re-submitted`       |
   | Open, most recent review per reviewer is `APPROVED` (no pending changes-requested) | `Approved`           |

   `Registered` has no GitHub equivalent — it's reserved for PRs a student
   is still planning to open, so auto-sync never produces it. The
   "commit pushed after changes requested" check (`Re-submitted`) only calls
   GitHub's commits endpoint when there's actually a `CHANGES_REQUESTED`
   review to disambiguate, to avoid extra API calls on the common path. See
   `backend/app/stage_mapping.py` for the exact logic.

4. Upserts each fetched PR into `pull_requests`, matched by
   `(student_id, url)` so re-syncing never creates duplicates:
   - **No existing doc for that URL** → creates a new one with
     `source: "auto"`.
   - **Existing doc, `source: "auto"`** → updates it in place (stage, title,
     repo, `source` stays `"auto"`).
   - **Existing doc, `source: "manual"`** → this is the "same PR URL"
     exception: its stage/title/repo are refreshed to match GitHub reality
     (so a manually-tracked PR doesn't go stale), but its `source` stays
     `"manual"` — sync updates it without silently relabeling something the
     student typed in by hand. This is a judgment call; if you'd rather auto
     PRs never touch manually-added rows at all, drop the `synced_manual`
     branch in `pull_requests.py`'s `sync_github_pull_requests`.

The manual **Add PR** flow (`POST /pull_requests`, always `source:
"manual"`) is untouched and still works exactly as in Phase 1 — GitHub sync
is purely additive.

## How mentor feedback + notifications work

### Access model (Phase 3 simplification)

Any user with `role == "mentor"` (or `"admin"`) can see and give feedback on
**every** student's PRs — there's no mentor-to-student assignment yet. The
backend only checks that the caller's role is `mentor`/`admin` (via
`Depends(get_current_user)` role checks, and `GET /users` via the
`require_role("mentor", "admin")` dependency), not which specific students
they're supposed to be mentoring. Proper assignment/filtering is intended for
a later admin phase.

### Feedback threads and replies

`feedback` is a single flat Firestore collection for both mentor feedback
and student replies — a reply is just another `feedback` doc with `parent_id`
set to the entry it's replying to, rather than a nested field on the parent
or a separate `replies` sub-collection/endpoint. That was chosen over a
dedicated reply field because it reuses the exact same model, create
endpoint, and permission checks for both directions of the conversation
(`POST /feedback` handles a mentor opening a thread *and* a student or
mentor replying into one), and keeps the storage shape consistent with how
`pull_requests` is a single flat collection rather than nested subcollections.

Rules enforced by `POST /feedback` (`backend/app/routers/feedback.py`):

- **Mentor/admin**: can always create a `feedback` doc — either a new
  top-level thread (`parent_id` omitted) or a reply into an existing one
  (`parent_id` set). `mentor_id`/`mentor_name` are stamped from the caller.
- **Student**: can only create a doc when `parent_id` is set (replying into
  an existing thread on their *own* PR) — attempting to open a new,
  non-reply thread returns `403`. `mentor_id`/`mentor_name` are left `null`
  on student-authored entries; `author_id`/`author_name`/`author_role` on
  every entry identify who actually wrote it (works for both mentor and
  student authors).
- Anyone else (a student who doesn't own the PR) gets `403`.

`GET /feedback/pr/{pr_id}` returns the full flat list for that PR (owner or
mentor/admin only), sorted by `created_at` in Python rather than via
Firestore `order_by` — filtering by `pr_id` and ordering by a different
field would need a composite index, which isn't worth the setup step for
what's typically a handful of docs per PR. The frontend (`PRDetailModal.jsx`)
groups that flat list into threads client-side: every entry descended from a
top-level entry (at any depth) is flattened into that thread's reply list, so
replying always targets the thread's root `feedback` doc regardless of which
message in the thread you clicked "Reply" under.

### Notifications

Whenever a mentor/admin successfully posts to `POST /feedback` (a new thread
or a reply), the backend also writes a doc to `notifications`:
`{ user_id: <the PR's student>, message, read: false, related_pr_id, created_at }`.
Student replies do **not** generate a notification back to the mentor (out of
scope for this phase — no mentor-assignment yet to know who to notify).

There's no push/email/websocket infra in this stack, so the frontend's
`NotificationBell` (in the header) polls `GET /notifications` every 30s and
on mount. Clicking the bell opens a dropdown of the caller's most recent
notifications and calls `POST /notifications/mark_read`, which flips every
currently-unread notification for that user to `read: true` — there's no
per-notification "mark as read", just "mark everything read on open", to
keep the UI to a single click.

## API overview

All endpoints require `Authorization: Bearer <firebase-id-token>`, except
`/auth/github/callback` (GitHub redirects the browser there directly, with
no way to attach that header — see "How GitHub sync works" above for how it
authenticates the request instead) and `/mentors` (needed before a student
account/token exists yet — see "How mentor-student mapping works" above).

| Method | Path                     | Who                   | Description                     |
|--------|--------------------------|------------------------|----------------------------------|
| GET    | `/pull_requests`         | any signed-in user     | Student: own PRs. Mentor: PRs of their assigned students only. Admin: all PRs |
| POST   | `/pull_requests`         | student                | Create a PR (`source` is always `"manual"`) |
| POST   | `/pull_requests/sync`    | student                | Fetch PRs from GitHub and upsert them (`source: "auto"`) |
| GET    | `/pull_requests/{id}`    | owner, mentor, admin   | Fetch one PR                    |
| PUT    | `/pull_requests/{id}`    | owner, mentor, admin   | Update fields / stage           |
| DELETE | `/pull_requests/{id}`    | owner or admin         | Delete a PR                     |
| GET    | `/auth/github/login`     | any signed-in user     | Returns `{ authorize_url }` to redirect the browser to |
| GET    | `/auth/github/callback`  | GitHub (no auth header)| OAuth callback; redirects back to the dashboard |
| GET    | `/mentors`               | public (no auth)       | Minimal `{ uid, name, email }` list of mentors, for the signup dropdown |
| GET    | `/users`                 | mentor, admin           | Mentor: only their assigned students. Admin: everyone. Used for profile details on the mentor dashboard |
| POST   | `/feedback`              | mentor/admin, or the PR's owning student replying | Create feedback (mentor/admin) or a reply (student, `parent_id` required) |
| GET    | `/feedback/pr/{pr_id}`   | owner, mentor, admin    | Full feedback thread for a PR, oldest first |
| GET    | `/notifications`         | any signed-in user      | Caller's most recent notifications (newest first, capped at 20) |
| POST   | `/notifications/mark_read` | any signed-in user    | Marks every unread notification for the caller as read |

PR `stage` is one of: `Registered`, `PR Raised`, `Under Review`,
`Changes Requested`, `Re-submitted`, `Approved`, `Merged`, `Closed/Rejected`.
PR `source` is `"manual"` or `"auto"`.

`feedback.status_recommendation` is one of `"approve"`, `"request_changes"`,
`"comment"`, or `null` (always `null` on student replies).

## Testing GitHub sync locally

1. Complete [step 4](#4-configure-github-oauth-for-auto-sync) above (OAuth
   App + `backend/.env`), then start both servers as in step 6.
2. Log in as a student and click **Connect GitHub** on the dashboard. You'll
   be sent to GitHub's consent screen, then redirected back with a green
   "GitHub connected" banner.
3. Click **Sync Now**. If the connected GitHub account has authored any
   public pull requests, they'll appear as cards labeled **GitHub sync**,
   with a stage computed from their current GitHub state.
4. To see the stage mapping react to real changes: open one of your PRs on
   GitHub, and if you have a second GitHub account handy, submit a
   "Request changes" review from it, then push a commit and click **Sync
   Now** again — the card should move `Changes Requested` → `Re-submitted`.
5. Add a PR manually via **Add PR** using the exact URL of one of your real
   GitHub PRs, then click **Sync Now** — it should update in place (stage
   refreshed) rather than creating a second card, and keep its **Manual**
   label.
6. To test the "not connected" path, use the Firebase console to delete the
   `github_tokens/{uid}` doc and clear `github_connected` on `users/{uid}` —
   the dashboard should fall back to showing **Connect GitHub** again.

Only PRs on **public** repos are visible to sync, by design — see "Scopes
requested" above.

## Troubleshooting

- **Frontend shows "Firebase config is missing"** — you haven't filled in
  `frontend/.env` yet.
- **Backend `/health` shows `firebase_configured: false`** — you haven't
  replaced `backend/firebase-admin-key.json` with your real service account
  key yet.
- **401/403 from the API** — make sure you're logged in on the frontend
  (the ID token is only attached to requests when a Firebase user session
  exists), and that the Firestore `users/{uid}` doc for your account has the
  role you expect.
- **"Connect GitHub" fails with a 500 mentioning `GITHUB_CLIENT_ID`** — you
  haven't created `backend/.env` yet, or it's missing values (see step 4).
  Restart `uvicorn` after editing `.env` — it's only loaded at process
  startup.
- **Redirected back with `?github=error`** — check the `uvicorn` server log;
  common causes are a callback URL that doesn't exactly match the OAuth
  App's configured one, an expired `state` (the OAuth flow has a 10-minute
  window), or a wrong `GITHUB_CLIENT_SECRET`.
- **"Sync Now" fails with "GitHub account is not connected yet"** — the
  `github_tokens/{uid}` doc is missing; click **Connect GitHub** again.
- **"Stored GitHub token could not be decrypted"** — `TOKEN_ENCRYPTION_KEY`
  in `backend/.env` changed since the token was stored (e.g. you regenerated
  it). Reconnect GitHub to re-encrypt with the current key.
- **Sync succeeds but returns 0 PRs** — the connected GitHub account either
  has no public PRs, or its most recent 30 (by `updated_at`) don't include
  the one you're looking for; open the PR on GitHub and leave a comment to
  bump its `updated_at`, then sync again.
