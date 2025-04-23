"use client";

import React, { Suspense } from "react";
import EmailPreview from "./EmailPreview";

export default function UserDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailPreview />
    </Suspense>
  );
}