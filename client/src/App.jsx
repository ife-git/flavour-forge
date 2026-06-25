import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { autoResizeTextarea } from "./utils";
import flavourIcon from "./flavour.svg";
import chefIcon from "./chef.svg";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/authContext";
import Login from "./pages/login";
import Signup from "./pages/signUp";
import Contact from "./pages/contact";
import Chat from "./pages/chat"; // Create this - move your chat code here
import ProtectedRoute from "./components/protectedRoute";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contact"
        element={
          <ProtectedRoute>
            <Contact />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
