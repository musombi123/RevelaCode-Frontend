"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const API = import.meta.env.VITE_API_URL;

export default function AdminPolicyManagement() {

  const { user } = useAuth();

  const [policyId, setPolicyId] = useState("");
  const [content, setContent] = useState("");

  async function savePolicy() {

    const res = await fetch(

      `${API}/api/admin/update-policy`,

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "X-API-KEY": user.apiKey

        },

        body: JSON.stringify({

          policy_id: policyId,

          content

        })

      }

    );

    const data = await res.json();

    alert(data.message);

  }

  return (

    <Card>

      <CardContent className="p-6 space-y-4">

        <h2 className="text-2xl font-bold">

          Policy Management

        </h2>

        <input

          className="w-full border rounded p-3"

          placeholder="Policy ID"

          value={policyId}

          onChange={(e)=>setPolicyId(e.target.value)}

        />

        <textarea

          rows={12}

          className="w-full border rounded p-3"

          placeholder="Policy Content"

          value={content}

          onChange={(e)=>setContent(e.target.value)}

        />

        <Button onClick={savePolicy}>

          Save Policy

        </Button>

      </CardContent>

    </Card>

  );

}