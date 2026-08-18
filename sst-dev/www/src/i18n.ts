export const en = {
  edit_page: "Edit this page",
  follow_on_x: "Follow us on X.com",
  find_bug: "Find a bug? Open an issue",
  join_discord: "Join our Discord community",
  built_with: "Built with",
  last_updated: "Last updated —",
  contact: "Contact",
  console: "Console",
  ai: "AI",
  loved_by: "Loved by thousands of teams",
  guide: "Guide",
  about: "About",
};

export const bn = {
  edit_page: "এই পৃষ্ঠাটি সম্পাদনা করুন",
  follow_on_x: "X.com-এ আমাদের অনুসরণ করুন",
  find_bug: "বাগ দেখেছেন? একটি ইস্যু খুলুন",
  join_discord: "আমাদের Discord কমিউনিটিতে যোগ দিন",
  built_with: "তৈরি করা হয়েছে",
  last_updated: "সর্বশেষ আপডেট —",
  contact: "যোগাযোগ",
  console: "কনসোল",
  ai: "এআই",
  loved_by: "হাজারো দলের দ্বারা প্রিয়",
  guide: "গাইড",
  about: "পরিচিতি",
};

export function t(key: string, lang: string = 'en') {
  const dict = lang === 'bn' ? bn : en;
  return (dict as any)[key] ?? (en as any)[key] ?? key;
}
