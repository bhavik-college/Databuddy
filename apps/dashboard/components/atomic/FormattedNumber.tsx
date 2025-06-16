"use client";

import type React from "react";
import { formatMetricNumber } from "@/lib/formatters";

interface FormattedNumberProps {
  id?: string; // Optional unique ID
  value: number;
  className?: string;
}

export const FormattedNumber: React.FC<FormattedNumberProps> = ({
  id,
  value,
  className,
}) => {
  return (
    <span id={id} className={className}>
      {formatMetricNumber(value)}
    </span>
  );
};

export default FormattedNumber; 