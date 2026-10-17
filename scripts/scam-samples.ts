import type { SignalId } from "../lib/scam";

// Test messages for scripts/test-scam.ts. Made up, but written like the real
// ones people in India receive. All names, numbers and links are fake.
//
// label:
//   scam      - must get "likely-scam" or "warning-signs", with `expect` reasons
//   benign    - must get "cant-tell" (no false alarm)
//   ambiguous - any verdict is acceptable; reported only

export interface Sample {
  id: string;
  lang: "en" | "hi" | "hinglish" | "mixed";
  label: "scam" | "benign" | "ambiguous";
  /** Signals that must be found (scam samples). */
  expect?: SignalId[];
  text: string;
}

export const SAMPLES: Sample[] = [
  // ---------- Scams: English ----------
  {
    id: "en-giftcard-officer",
    lang: "en",
    label: "scam",
    expect: ["fake-official-channel", "payment-method", "threats"],
    text: "This is Officer Daniel Brooks from the US Embassy New Delhi. Your visa file has an error. To avoid deportation of your son you must pay the penalty with Google Play gift cards worth Rs 25,000. WhatsApp the codes to my personal number +91 98110 45672.",
  },
  {
    id: "en-guarantee-agent",
    lang: "en",
    label: "scam",
    expect: ["guarantee", "payment-method"],
    text: "Guaranteed US B2 visa in 15 days, 100% approval, no interview needed! Our agent will handle everything. Pay advance Rs 40,000 by UPI to visaexpert@ybl to start.",
  },
  {
    id: "en-fasttrack",
    lang: "en",
    label: "scam",
    expect: ["pay-to-speed-up"],
    text: "Tired of waiting 400 days? We can fast-track your US visa interview to next week. Service charge only Rs 15,000. Limited slots. Reply YES.",
  },
  {
    id: "en-otp-request",
    lang: "en",
    label: "scam",
    expect: ["asks-for-otp-or-bank"],
    text: "Dear Applicant, your DS-160 payment failed. To confirm your appointment please share the OTP you just received on your mobile.",
  },
  {
    id: "en-shortlink-urgent",
    lang: "en",
    label: "scam",
    expect: ["short-link", "urgency", "grammar-and-pressure"],
    text: "URGENT!! Dear Customer ur US visa appointment will be CANCELLED TODAY. Kindly verify immediately at bit.ly/usvisa-verify24 to avoid loss of slot!!",
  },
  {
    id: "en-lottery",
    lang: "en",
    label: "scam",
    expect: ["job-or-lottery", "payment-method"],
    text: "Congratulations! You have won the USA Visa Lucky Draw 2026 and a free B-2 visa. Pay processing fee of $150 by Western Union to claim your prize.",
  },
  {
    id: "en-job-offer",
    lang: "en",
    label: "scam",
    expect: ["job-or-lottery"],
    text: "Job offer in Florida: caretaker job with salary of $3500 per month. We arrange your visitor visa, you can work after you land. Send registration fee to confirm.",
  },
  {
    id: "en-arrest-threat",
    lang: "en",
    label: "scam",
    expect: ["threats", "urgency", "payment-method"],
    text: "FINAL NOTICE: An arrest warrant has been issued because your visa documents are fake. Pay the clearance amount in cash to our agent today only, otherwise police will come to your house.",
  },
  {
    id: "en-fake-site",
    lang: "en",
    label: "scam",
    expect: ["non-gov-link", "asks-for-documents", "urgency"],
    text: "US Visa Help Desk: your interview slot is held for 24 hours. Upload your passport scan and Aadhaar at https://usvisa-help-india.com/upload within 2 hours or the slot is released. You can also send passport copy on this chat.",
  },
  {
    id: "en-crypto",
    lang: "en",
    label: "scam",
    expect: ["payment-method"],
    text: "Visa bond refund pending. For security, deposit 200 USDT to the wallet below and the embassy will release your visa within 3 days.",
  },

  // ---------- Scams: Hindi ----------
  {
    id: "hi-embassy-whatsapp",
    lang: "hi",
    label: "scam",
    expect: ["fake-official-channel", "asks-for-otp-or-bank"],
    text: "नमस्ते, मैं अमेरिकी दूतावास से बोल रहा हूँ। आपके वीज़ा आवेदन में समस्या है। तुरंत इस नंबर पर व्हाट्सएप करें 9876501234 और अपना ओटीपी बताएं।",
  },
  {
    id: "hi-guarantee-cash",
    lang: "hi",
    label: "scam",
    expect: ["guarantee", "payment-method"],
    text: "हम आपको अमेरिका का वीज़ा पक्का दिलाएंगे, 100% गारंटी। बस ₹50,000 नकद हमारे दफ़्तर में जमा करें।",
  },
  {
    id: "hi-threat-upi",
    lang: "hi",
    label: "scam",
    expect: ["threats", "payment-method", "urgency"],
    text: "आपका वीज़ा रद्द कर दिया जाएगा और आपके बेटे को डिपोर्ट किया जाएगा। आज ही ₹10,000 यूपीआई से भेजें, वरना पुलिस कार्रवाई होगी।",
  },
  {
    id: "hi-early-appointment",
    lang: "hi",
    label: "scam",
    expect: ["pay-to-speed-up"],
    text: "क्या आप जल्दी अपॉइंटमेंट चाहते हैं? सिर्फ़ 8 हजार रुपये में अगले हफ़्ते का स्लॉट। अभी कॉल करें।",
  },
  {
    id: "hi-lottery",
    lang: "hi",
    label: "scam",
    expect: ["job-or-lottery"],
    text: "बधाई हो! आपने अमेरिका वीज़ा लॉटरी जीती है। इनाम पाने के लिए अपना बैंक खाता नंबर भेजें।",
  },

  // ---------- Scams: Hinglish and mixed ----------
  {
    id: "hl-agent-pakka",
    lang: "hinglish",
    label: "scam",
    expect: ["guarantee", "payment-method"],
    text: "Namaste aunty ji, aapka US visa pakka milega, koi tension nahi. Bas 30 hazaar GPay kar do 98290 11223 pe, baaki hum dekh lenge.",
  },
  {
    id: "hl-jaldi-slot",
    lang: "hinglish",
    label: "scam",
    expect: ["pay-to-speed-up"],
    text: "Visa interview ki date jaldi chahiye? Hum 2 din me slot dila denge. Charges 12000 rs only. Interested ho to reply karo.",
  },
  {
    id: "hl-embassy-otp",
    lang: "hinglish",
    label: "scam",
    expect: ["fake-official-channel", "asks-for-otp-or-bank"],
    text: "Main US embassy se bol raha hoon. Aapke visa me verification baaki hai. Jo OTP aaya hai woh abhi WhatsApp pe bhej do.",
  },
  {
    id: "hl-passport-telegram",
    lang: "hinglish",
    label: "scam",
    expect: ["asks-for-documents", "fake-official-channel"],
    text: "Hum consulate ki visa team hain. Apna passport photo aur aadhar card Telegram pe bhejiye, warna aapki file band ho jayegi.",
  },
  {
    id: "mixed-deport-wa",
    lang: "mixed",
    label: "scam",
    expect: ["threats", "fake-official-channel"],
    text: "Dear Sharda ji, I am calling from US Consulate Mumbai. आपका visa blacklist हो गया है। Call me on WhatsApp 7012345678 immediately, nahi to aapko deport kar diya jayega.",
  },
  {
    id: "mixed-shortlink-fee",
    lang: "mixed",
    label: "scam",
    expect: ["short-link", "urgency"],
    text: "US Visa: आपकी अपॉइंटमेंट की last chance है। Fee abhi pay karo: tinyurl.com/visa-fee-2026",
  },
  {
    id: "mixed-paytm-agent",
    lang: "mixed",
    label: "scam",
    expect: ["payment-method", "pay-to-speed-up"],
    text: "Sir, VIP appointment possible hai. Extra fee 5000 Paytm kar dijiye is number pe, kal tak confirm.",
  },

  // ---------- Benign ----------
  {
    id: "en-official-reminder",
    lang: "en",
    label: "benign",
    text: "Reminder: your visa interview is on 14 November 2026 at 9:30 AM at the U.S. Embassy, New Delhi. Bring your passport, DS-160 confirmation page and appointment letter. Arrive 15 minutes early.",
  },
  {
    id: "en-son-family",
    lang: "en",
    label: "benign",
    text: "Hi Ma, I booked your flight for December. Your visa interview is next week, don't be nervous, just answer honestly. Gainesville is cold in the mornings so bring a sweater. Love you.",
  },
  {
    id: "en-fraud-advice",
    lang: "en",
    label: "benign",
    text: "Please remember: the embassy will never ask you to pay by UPI or gift card, and no one can guarantee a visa. Never share your OTP or password with anyone.",
  },
  {
    id: "en-gov-link",
    lang: "en",
    label: "benign",
    text: "You can check the current interview wait times here: https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html",
  },
  {
    id: "hi-family",
    lang: "hi",
    label: "benign",
    text: "माँ, आपका वीज़ा इंटरव्यू अगले सोमवार को है। घबराना मत, बस सच बताना। मैं आपको एयरपोर्ट पर लेने आऊँगा।",
  },
  {
    id: "hi-reminder",
    lang: "hi",
    label: "benign",
    text: "याद रखें: अपना पासपोर्ट और DS-160 पुष्टि पृष्ठ साथ लेकर आएं। इंटरव्यू से 15 मिनट पहले पहुँचें।",
  },
  {
    id: "hl-family",
    lang: "hinglish",
    label: "benign",
    text: "Mummy visa ka interview Monday ko hai, tension mat lo. Papa ke saath chale jaana, main video call karunga. Sweater pack kar lena.",
  },
  {
    id: "hl-advice",
    lang: "hinglish",
    label: "benign",
    text: "Mummy dhyan rakhna, koi bhi call kare aur OTP maange to kisi ko OTP mat batana. Embassy kabhi WhatsApp pe call nahi karti.",
  },
  {
    id: "mixed-flight",
    lang: "mixed",
    label: "benign",
    text: "Visa approve ho gaya! 🎉 Ab flight book karte hain. Gainesville मे आपका कमरा तैयार है।",
  },
  {
    id: "en-sister-visa",
    lang: "en",
    label: "benign",
    text: "Didi, my visa was approved last year in Mumbai. The officer asked me only three questions. Just carry your bank statements and stay calm.",
  },

  // ---------- Round 3: held-out messages, written before re-running ----------
  {
    id: "en-vfs-refund",
    lang: "en",
    label: "scam",
    expect: ["asks-for-otp-or-bank"],
    text: "VFS Global: Your visa fee of Rs 16,000 is refundable. To get the refund, share your debit card number and CVV with our executive.",
  },
  {
    id: "hl-officer-phonepe",
    lang: "hinglish",
    label: "scam",
    expect: ["payment-method"],
    text: "Hello madam, main visa officer Rajesh bol raha hoon embassy se. Aapka interview cancel ho gaya hai. Naya slot ke liye 7500 rupaye PhonePe karo.",
  },
  {
    id: "hi-passport-whatsapp",
    lang: "hi",
    label: "scam",
    expect: ["asks-for-documents"],
    text: "प्रिय आवेदक, अपने पासपोर्ट की फोटो और आधार कार्ड व्हाट्सएप पर भेजें ताकि आपकी फाइल आगे बढ़ सके। जल्दी करें।",
  },
  {
    id: "en-waiver-giftcard",
    lang: "en",
    label: "scam",
    expect: ["payment-method", "non-gov-link"],
    text: "Good news! You are selected for interview waiver. Pay $100 via Amazon gift card at uswaiver-dept.org to get your visa stamped.",
  },
  {
    id: "en-lookalike-link",
    lang: "en",
    label: "scam",
    expect: ["non-gov-link", "urgency"],
    text: "Your visa status has changed. Check now: http://travel-state-gov.info/status before midnight.",
  },
  {
    id: "en-son-fee-paid",
    lang: "en",
    label: "benign",
    text: "Ma, I paid your visa fee online from my card. The receipt is in your email. Now we can book the interview.",
  },
  {
    id: "hl-son-documents",
    lang: "hinglish",
    label: "benign",
    text: "Mummy main kal call karunga, visa ke documents ready rakhna: passport, photo, bank statement.",
  },
  {
    id: "en-official-fee",
    lang: "en",
    label: "benign",
    text: "Visa application fee: $185. Pay only through the official appointment website. Do not pay cash to any agent.",
  },
  {
    id: "hi-pin-advice",
    lang: "hi",
    label: "benign",
    text: "बैंक कभी आपका पिन नहीं पूछता। किसी को OTP न बताएं।",
  },
  {
    id: "en-embassy-gov-link",
    lang: "en",
    label: "benign",
    text: "This is the U.S. Embassy New Delhi. Your passport is ready for collection. See https://in.usembassy.gov/visas/ for pickup details.",
  },

  // ---------- Ambiguous ----------
  {
    id: "amb-whatsapp-group",
    lang: "en",
    label: "ambiguous",
    text: "Join our WhatsApp group for US visa interview tips: chat.whatsapp.com/AbCdEf123",
  },
  {
    id: "amb-son-passport-photo",
    lang: "hinglish",
    label: "ambiguous",
    text: "Mummy, passport ki photo bhej do WhatsApp pe, main DS-160 form bhar raha hoon.",
  },
  {
    id: "amb-portal-link",
    lang: "en",
    label: "ambiguous",
    text: "Your appointment has been scheduled. Log in to the appointment portal at https://www.example-visa-portal.com to see the details.",
  },
  {
    id: "amb-urgent-family",
    lang: "en",
    label: "ambiguous",
    text: "Ma please call me urgently, need to discuss your visa interview date.",
  },
  {
    id: "amb-fee-upi-question",
    lang: "hinglish",
    label: "ambiguous",
    text: "Beta, visa fee UPI se pay kar sakte hai kya? Ya bank jaana padega?",
  },
  {
    id: "amb-agent-help",
    lang: "en",
    label: "ambiguous",
    text: "Hello, I am a travel agent in Jaipur. I can help you fill your DS-160 form. My fee is Rs 2000.",
  },
];
