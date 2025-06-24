"use client";

import React, { Suspense } from "react";
import Checkout from "./Checkout";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Checkout />
    </Suspense>
  );
}