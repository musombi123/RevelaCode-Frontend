"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const ADMIN_API_KEY = "bbit070j2003@RC#2026!";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    login({
      fullName: "Musombi William",
      contact: "admin",
      role: "admin",
      apiKey: ADMIN_API_KEY,
    });

    navigate("/pages", { replace: true });
  }, [login, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70">
      <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-xl">
        <h2 className="text-xl font-bold">
          Opening Admin Dashboard...
        </h2>

        <p className="mt-2 text-gray-500">
          Authenticating administrator...
        </p>
      </div>
    </div>
  );
}