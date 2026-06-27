"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const API = import.meta.env.VITE_API_URL;

export default function AdminScriptureManagement() {

  const { user } = useAuth();

  const [scriptureId, setScriptureId] = useState("");
  const [content, setContent] = useState("");

  async function updateScripture() {

    const res = await fetch(

      `${API}/api/admin/update-scripture`,

      {

        method: "POST",

        headers: {

          "Content-Type":"application/json",

          "X-API-KEY":user.apiKey

        },

        body:JSON.stringify({

          id:scriptureId,

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

          Scripture Management

        </h2>

        <input

          className="w-full border rounded p-3"

          placeholder="Scripture ID"

          value={scriptureId}

          onChange={(e)=>setScriptureId(e.target.value)}

        />

        <textarea

          rows={12}

          className="w-full border rounded p-3"

          placeholder="Updated Scripture"

          value={content}

          onChange={(e)=>setContent(e.target.value)}

        />

        <Button onClick={updateScripture}>

          Update Scripture

        </Button>

      </CardContent>

    </Card>

  );

}