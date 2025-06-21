"use client";

import React, { Suspense } from "react";
import Confirmation from "./Confirmation";

export default function ThankyouPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Confirmation />
    </Suspense>
  );
}