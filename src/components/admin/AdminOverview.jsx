"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext.jsx";

const API = import.meta.env.VITE_API_URL;

export default function AdminOverview() {

  const { user } = useAuth();

  const [dashboard, setDashboard] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {

    try {

      const headers = {
        "X-API-KEY": user.apiKey
      };

      const [dashRes, statsRes] = await Promise.all([
        fetch(`${API}/admin/dashboard`, { headers }),
        fetch(`${API}/admin/study/stats`, { headers })
      ]);

      const dash = await dashRes.json();
      const study = await statsRes.json();

      setDashboard(dash);
      setStats(study);

    } catch (err) {

      console.log(err);

    }

    setLoading(false);

  }

  if (loading) {

    return <p>Loading dashboard...</p>;

  }

  return (

    <div className="space-y-6">

      <h2 className="text-2xl font-bold">

        Dashboard Overview

      </h2>

      <div className="grid md:grid-cols-4 gap-5">

        <Card>

          <CardContent className="p-6">

            <h3>Total Materials</h3>

            <p className="text-3xl font-bold">

              {stats.total_materials || 0}

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <h3>Faith Lessons</h3>

            <p className="text-3xl font-bold">

              {stats.faith_materials || 0}

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <h3>Education Lessons</h3>

            <p className="text-3xl font-bold">

              {stats.education_materials || 0}

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <h3>Status</h3>

            <p className="text-green-600 font-semibold">

              Online

            </p>

          </CardContent>

        </Card>

      </div>

      <Card>

        <CardContent className="p-6">

          <h3 className="font-bold mb-3">

            Admin Message

          </h3>

          <p>

            {dashboard.message}

          </p>

        </CardContent>

      </Card>

    </div>

  );

}