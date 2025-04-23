"use client";

import React, { Suspense } from "react";
import Purchase from "./Purchase";

export default function UserDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Purchase />
    </Suspense>
  );
}