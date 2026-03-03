"use client";

import React from "react";

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm font-semibold text-gray-700 ${className}`} {...props} />;
}
