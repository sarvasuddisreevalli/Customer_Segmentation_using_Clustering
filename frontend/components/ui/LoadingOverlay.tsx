"use client";

import React from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = () => {
  // Disabled global full-screen modal overlay as requested by user
  return null;
};
