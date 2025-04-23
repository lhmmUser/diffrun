"use client";

import React, { Suspense } from "react";
import UserDetails from "./UserDetails";

export default function UserDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserDetails />
    </Suspense>
  );
}