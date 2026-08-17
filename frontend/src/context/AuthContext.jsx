import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  // { uid, name, email, role, github_connected?, github_username?, last_synced_at? }
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.exists() ? { uid, ...snap.data() } : null;
    setProfile(data);
    return data;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signup({ name, email, password, role, rollNumber, collegeName, year, mentorId }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const userDoc = {
      uid: credential.user.uid,
      name,
      email,
      role,
      created_at: serverTimestamp(),
    };
    if (role === "student") {
      userDoc.roll_number = rollNumber || null;
      userDoc.college_name = collegeName || null;
      userDoc.year = year || null;
      userDoc.mentor_id = mentorId || null;
    }
    await setDoc(doc(db, "users", credential.user.uid), userDoc);
    setProfile(userDoc);
    return credential.user;
  }

  async function login({ email, password }) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(credential.user.uid);
    return credential.user;
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshProfile() {
    if (!firebaseUser) return null;
    return loadProfile(firebaseUser.uid);
  }

  const value = {
    firebaseUser,
    profile,
    role: profile?.role,
    loading,
    signup,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
