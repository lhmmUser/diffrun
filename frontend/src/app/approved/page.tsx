"use client";

import React, { Suspense } from "react";
import Approved from "./Approved";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Approved />
    </Suspense>
  );
}