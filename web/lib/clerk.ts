export const clerkAppearance = {
  variables: {
    colorPrimary: "#75aa46",
    colorText: "#1b2c56",
    borderRadius: "1.5rem",
    fontSize: "1.05rem",
  },
  elements: {
    card: "shadow-2xl border border-gray-100 rounded-[1.5rem] overflow-hidden",
    headerTitle: "text-[1.7rem] font-extrabold text-[#1b2c56]",
    headerSubtitle: "text-sm text-gray-500 mt-1",
    formButtonPrimary:
      "font-black text-[1.05rem] text-white py-[14px] transition-all hover:bg-[#5d8a38]",
    formFieldInput: "rounded-xl border border-gray-200 shadow-sm",
    footerActionText: "text-sm",
    footerActionLink: "text-[#75aa46] font-bold text-sm hover:text-[#5d8a38]",
    badge: "hidden",
  },
} as const;
