"use client";

import React, { Suspense } from "react";
import Form from "./ChildDetails";

export default function UserDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Form />
    </Suspense>
  );
}