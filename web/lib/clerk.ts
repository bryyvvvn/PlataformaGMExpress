export const clerkAppearance = {
  variables: {
    colorPrimary: "#75AA46",
    colorText: "#1B2C56",
    colorTextSecondary: "#64748b",
    colorBackground: "#ffffff",
    colorInputBackground: "#f8fafc",
    colorInputText: "#0f172a",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full max-w-md mx-auto p-6",
    cardBox: "w-full shadow-none",
    card:
      "w-full border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    main: "gap-4",
    form: "gap-4",
    formField: "gap-1.5",
    formFieldLabel: "text-xs font-bold uppercase tracking-wider text-slate-500",
    formFieldInput:
      "h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-none transition-colors focus:border-[#1B2C56] focus:bg-white focus:ring-2 focus:ring-[#1B2C56]/10",
    formButtonPrimary:
      "h-11 rounded-md bg-[#75AA46] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5d8a38] focus:ring-2 focus:ring-[#75AA46]/30",
    socialButtonsBlockButton:
      "h-11 rounded-md border border-slate-200 bg-white text-sm font-semibold text-[#1B2C56] shadow-sm hover:bg-slate-50",
    dividerLine: "bg-slate-200",
    dividerText: "text-xs font-semibold uppercase tracking-wider text-slate-400",
    footer: "pt-3",
    footerActionText: "text-xs text-slate-500",
    footerActionLink: "text-xs font-bold text-[#75AA46] hover:text-[#5d8a38]",
    identityPreviewText: "text-sm font-semibold text-[#1B2C56]",
    formResendCodeLink: "text-sm font-bold text-[#75AA46] hover:text-[#5d8a38]",
    otpCodeFieldInput:
      "rounded-md border border-slate-200 text-[#1B2C56] focus:border-[#75AA46] focus:ring-[#75AA46]/20",
    alert: "rounded-md border border-red-200 bg-red-50 text-red-700",
    badge: "hidden",
  },
} as const;
