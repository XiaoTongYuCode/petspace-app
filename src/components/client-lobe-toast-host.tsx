"use client";

import { ThemeProvider } from "@lobehub/ui";
import { ToastHost } from "@lobehub/ui/base-ui";

export function ClientLobeToastHost() {
  return (
    <ThemeProvider
      customTheme={{ neutralColor: "sand", primaryColor: "volcano" }}
      enableCustomFonts={false}
    >
      <ToastHost position="top" />
    </ThemeProvider>
  );
}
