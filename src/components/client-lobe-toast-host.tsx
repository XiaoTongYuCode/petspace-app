"use client";

import { ThemeProvider } from "@lobehub/ui";
import { ToastHost } from "@lobehub/ui/base-ui";
import type { CSSProperties } from "react";

const toastLayerStyle: CSSProperties = {
  inset: 0,
  pointerEvents: "none",
  position: "fixed",
  zIndex: 1200,
};

export function ClientLobeToastHost() {
  return (
    <div
      className="petspace-toast-layer"
      aria-hidden={false}
      style={toastLayerStyle}
    >
      <style>
        {`
          .petspace-toast-layer .ant-app {
            height: 0 !important;
            min-height: 0 !important;
            pointer-events: none;
          }

          .petspace-toast-layer .petspace-toast-viewport {
            pointer-events: none !important;
          }

          .petspace-toast-layer .petspace-toast-viewport > [role="dialog"] {
            pointer-events: auto;
          }
        `}
      </style>
      <ThemeProvider
        customTheme={{ neutralColor: "sand", primaryColor: "volcano" }}
        enableCustomFonts={false}
      >
        <ToastHost className="petspace-toast-viewport" position="top" />
      </ThemeProvider>
    </div>
  );
}
