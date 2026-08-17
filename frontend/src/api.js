import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in.");
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function listPullRequests() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/pull_requests`, { headers });
  return handleResponse(res);
}

export async function createPullRequest({ repo, url, title, stage }) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/pull_requests`, {
    method: "POST",
    headers,
    body: JSON.stringify({ repo, url, title, stage }),
  });
  return handleResponse(res);
}

export async function updatePullRequest(id, updates) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/pull_requests/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function deletePullRequest(id) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/pull_requests/${id}`, {
    method: "DELETE",
    headers,
  });
  return handleResponse(res);
}

export async function getGithubAuthorizeUrl() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/auth/github/login`, { headers });
  return handleResponse(res);
}

export async function syncGithubPullRequests() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/pull_requests/sync`, {
    method: "POST",
    headers,
  });
  return handleResponse(res);
}

export async function listPublicMentors() {
  // No auth header: called from the signup form before the student's
  // Firebase Auth account (and ID token) exists yet.
  const res = await fetch(`${API_BASE_URL}/mentors`);
  return handleResponse(res);
}

export async function listUsers() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/users`, { headers });
  return handleResponse(res);
}

export async function listFeedbackForPR(prId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/feedback/pr/${prId}`, { headers });
  return handleResponse(res);
}

export async function createFeedback({ pr_id, comment, status_recommendation, parent_id }) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers,
    body: JSON.stringify({ pr_id, comment, status_recommendation, parent_id }),
  });
  return handleResponse(res);
}

export async function listNotifications() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/notifications`, { headers });
  return handleResponse(res);
}

export async function markNotificationsRead() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/notifications/mark_read`, {
    method: "POST",
    headers,
  });
  return handleResponse(res);
}
