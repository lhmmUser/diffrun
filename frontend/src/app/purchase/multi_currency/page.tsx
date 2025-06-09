"use client";

import React, { Suspense } from "react";
import MultiCurrency from "./MultiCurrency";

export default function UserDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MultiCurrency />
    </Suspense>
  );
}