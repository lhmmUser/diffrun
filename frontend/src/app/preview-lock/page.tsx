"use client";

import React, { Suspense } from "react";
import Preview from "./Preview";

export default function UserDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Preview />
    </Suspense>
  );
}