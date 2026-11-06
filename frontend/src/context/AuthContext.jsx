
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth, googleProvider } from "../firebase/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Signup with email and password
  async function signup(name, email, password) {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(result.user, {
      displayName: name,
    });

    return result.user;
  }

  // Login with email and password
  async function login(email, password) {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return result.user;
  }

  // Login with Google
  async function loginWithGoogle() {
    const result = await signInWithPopup(
      auth,
      googleProvider
    );

    return result.user;
  }

  // Logout
  async function logout() {
    await signOut(auth);
  }

  // Forgot password
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  // Track authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}
