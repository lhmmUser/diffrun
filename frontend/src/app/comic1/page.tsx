"use client";

import React, { Suspense } from "react";
import Comic from "./Comic";

export default function UserDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comic />
    </Suspense>
  );
}