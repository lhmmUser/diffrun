"use client";

import React, { Suspense } from "react";
import Thankyou from "./Thankyou";

export default function ThankyouPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Thankyou />
    </Suspense>
  );
}