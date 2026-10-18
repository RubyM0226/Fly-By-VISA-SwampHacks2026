import { LINKS } from "@/lib/config";
import type { DocId } from "./documents";
import type { StepId } from "@/lib/journey";
import type { Lang } from "@/lib/settings";

// Step content for the U.S. visa journey (visit, study or work), from India, the UK or Mexico.
// Written once with home-country tokens ({home}, {vac}) and India's links; see
// lib/homeCountry.ts. Render through useHome().loc, never raw.
//
// Sources for the facts: the U.S. State Department visitor visa page
// (travel.state.gov) unless marked otherwise. Anything marked VERIFY came from
// non-official guides and must be checked against the official page.
//
// Write for an elderly reader in India: need-to-know only, one short sentence
// per bullet. Write the English first, then Hindi. Hindi is a first draft:
// have a fluent reader check it. Use [[term|Shown text]] to make a glossary
// chip (terms are defined in content/glossary.ts).

export interface StepText {
  title: string;
  /** Short label for the roadmap pill (one or two words). The card keeps the full title. */
  pill: string;
  /** What to do, one short sentence per bullet. */
  what: string[];
  /** One short fact per bullet. Leave out when there is nothing useful to say; the section is then hidden. */
  cost?: string[];
  time?: string[];
  /** One-line summary, shown in the "Your next step" card. */
  simple: string;
}

export interface StepLink {
  label: Record<Lang, string>;
  url: string;
}

export interface StepContent {
  id: StepId;
  text: Record<Lang, StepText>;
  /** The "What you need" list: ids from content/documents.ts. */
  documents: DocId[];
  links: StepLink[];
  /** Optional in-app button shown at the top of the step's details. */
  action?: { label: Record<Lang, string>; href: string };
}

export const STEPS: StepContent[] = [
  {
    id: "ready",
    documents: ["passport", "travelDates"],
    text: {
      en: {
        title: "Get ready",
        pill: "Prepare",
        what: [
          "Check your passport.",
          "It must still be valid 6 months after you come home.",
          "Know why you are going.",
          "Know how long you will stay.",
        ],
        time: ["About 1 week."],
        simple: "Make sure your passport will not expire soon. Know why you are going.",
      },
      hi: {
        title: "तैयारी करें",
        pill: "तैयारी",
        what: [
          "अपना पासपोर्ट देखें।",
          "लौटने के 6 महीने बाद तक वह मान्य होना चाहिए।",
          "जानें कि आप क्यों जा रहे हैं।",
          "जानें कि आप कितने समय रुकेंगे।",
        ],
        time: ["लगभग 1 सप्ताह।"],
        simple: "देखिए कि पासपोर्ट जल्दी खत्म न हो रहा हो। जानिए कि आप क्यों जा रहे हैं।",
      },
      es: {
        title: "Prepárese",
        pill: "Preparación",
        what: [
          "Revise su pasaporte.",
          "Debe seguir vigente 6 meses después de que regrese a casa.",
          "Sepa por qué viaja.",
          "Sepa cuánto tiempo se quedará.",
        ],
        time: ["Aproximadamente 1 semana."],
        simple: "Asegúrese de que su pasaporte no venza pronto. Sepa por qué viaja.",
      },
    },
    links: [
      {
        label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ", es: "Página oficial de la visa de visitante" },
        url: LINKS.visitorVisa,
      },
      {
        label: { en: "Official Visa Wizard", hi: "आधिकारिक वीज़ा विज़ार्ड", es: "Asistente oficial de visas (Visa Wizard)" },
        url: LINKS.visaWizard,
      },
    ],
  },
  {
    id: "ds160",
    documents: ["passport", "travelFamilyDetails", "photo"],
    text: {
      en: {
        title: "Fill in the online form",
        pill: "Form",
        what: [
          "Fill in the online form [[ds160|DS-160]].",
          "Answer every question honestly.",
          "Upload a photo that follows the rules.",
          "At the end, print the page with the barcode.",
          "Take this page to your interview.",
        ],
        cost: ["The form is free.", "You pay the visa fee in the next step."],
        time: ["A few hours.", "You can save the form and finish it later."],
        simple: "Answer every question honestly. Print the confirmation page at the end.",
      },
      hi: {
        title: "ऑनलाइन फ़ॉर्म भरें",
        pill: "फ़ॉर्म",
        what: [
          "ऑनलाइन फ़ॉर्म [[ds160|DS-160]] भरें।",
          "हर सवाल का सच्चा जवाब दें।",
          "नियमों के अनुसार फ़ोटो अपलोड करें।",
          "अंत में बारकोड वाला पृष्ठ प्रिंट करें।",
          "यह पृष्ठ इंटरव्यू में ले जाएँ।",
        ],
        cost: ["फ़ॉर्म मुफ़्त है।", "वीज़ा शुल्क आप अगले कदम में भरते हैं।"],
        time: ["कुछ घंटे।", "आप फ़ॉर्म सेव करके बाद में पूरा कर सकते हैं।"],
        simple: "हर सवाल का जवाब सच्चाई से दें। अंत में पुष्टि पृष्ठ प्रिंट करें।",
      },
      es: {
        title: "Llene el formulario en línea",
        pill: "Formulario",
        what: [
          "Llene el formulario en línea [[ds160|DS-160]].",
          "Responda todas las preguntas con sinceridad.",
          "Suba una foto que cumpla las reglas.",
          "Al final, imprima la página con el código de barras.",
          "Lleve esta página a su entrevista.",
        ],
        cost: ["El formulario es gratis.", "La tarifa de la visa se paga en el siguiente paso."],
        time: ["Unas pocas horas.", "Puede guardar el formulario y terminarlo más tarde."],
        simple: "Responda todas las preguntas con sinceridad. Imprima la página de confirmación al final.",
      },
    },
    links: [
      { label: { en: "Open the official DS-160 form", hi: "आधिकारिक DS-160 फ़ॉर्म खोलें", es: "Abrir el formulario oficial DS-160" }, url: LINKS.ds160 },
      { label: { en: "Official photo rules", hi: "फ़ोटो के आधिकारिक नियम", es: "Reglas oficiales de la foto" }, url: LINKS.photoRules },
    ],
  },
  {
    id: "book",
    documents: ["ds160Confirmation", "feeReceipt", "passport"],
    text: {
      en: {
        title: "Pay the fee and book your appointments",
        pill: "Appointments",
        what: [
          "Pay the visa fee.",
          "Then book your interview at a U.S. office in {home}.",
          "You may also need to visit a [[vac|{vac}]] first, for fingerprints.",
          "Book as early as you can. The wait is long.",
          "Follow the U.S. Embassy website. The steps can change.",
        ],
        cost: ["Visa fee: $185.", "Other fees may apply."],
        time: ["Booking: about 1 day.", "Waiting for the interview: usually months."],
        simple: "Pay, then book. Book as early as you can.",
      },
      hi: {
        title: "शुल्क भरें और अपॉइंटमेंट बुक करें",
        pill: "अपॉइंटमेंट",
        what: [
          "वीज़ा शुल्क भरें।",
          "फिर {home} में किसी U.S. कार्यालय में इंटरव्यू बुक करें।",
          "शायद पहले उंगलियों के निशान के लिए [[vac|{vac}]] भी जाना पड़े।",
          "जितना जल्दी हो सके बुक करें। प्रतीक्षा लंबी होती है।",
          "U.S. Embassy की वेबसाइट देखें। तरीके बदल सकते हैं।",
        ],
        cost: ["वीज़ा शुल्क: $185।", "दूसरे शुल्क भी लग सकते हैं।"],
        time: ["बुकिंग: लगभग 1 दिन।", "इंटरव्यू की प्रतीक्षा: आमतौर पर कई महीने।"],
        simple: "पहले भुगतान करें, फिर बुक करें। जितना जल्दी हो सके बुक करें।",
      },
      es: {
        title: "Pague la tarifa y reserve sus citas",
        pill: "Citas",
        what: [
          "Pague la tarifa de la visa.",
          "Luego reserve su entrevista en una oficina de U.S. en India.",
          "Quizás deba ir primero a un [[vac|{vac}]], para las huellas digitales.",
          "Reserve lo antes posible. La espera es larga.",
          "Siga el sitio web de la U.S. Embassy Los pasos pueden cambiar.",
        ],
        cost: ["Tarifa de la visa: $185.", "Pueden aplicarse otras tarifas."],
        time: ["Reservar: aproximadamente 1 día.", "Esperar la entrevista: normalmente meses."],
        simple: "Pague y luego reserve. Reserve lo antes posible.",
      },
    },
    // VERIFY: the two-appointment (VAC + interview) flow and the booking portal
    // for India come from non-official guides that disagree. Confirm on the
    // embassy page before the demo.
    links: [
      { label: { en: "Official fee page", hi: "आधिकारिक शुल्क पृष्ठ", es: "Página oficial de tarifas" }, url: LINKS.fees },
      { label: { en: "U.S. Embassy in {home}: visas", hi: "{home} में U.S. Embassy: वीज़ा", es: "U.S. Embassy en {home}: visas" }, url: LINKS.embassyIndia },
      { label: { en: "Official wait times", hi: "आधिकारिक प्रतीक्षा समय", es: "Tiempos de espera oficiales" }, url: LINKS.waitTimes },
    ],
  },
  {
    id: "documents",
    documents: ["passport", "ds160Confirmation", "feeReceipt", "appointmentLetters", "lifeInIndia", "fundsProof", "tripPlan"],
    text: {
      en: {
        title: "Gather your documents",
        pill: "Documents",
        what: [
          "Collect the papers the officer may ask for.",
          "Show that your life is in {home}: family, home or pension.",
          "Show that you will come home.",
          "Show how the trip will be paid for.",
          "A letter from family in the U.S. is not needed.",
        ],
        time: ["1 to 2 weeks."],
        simple: "Gather papers that show your life is in {home} and that you will go home after the trip.",
      },
      hi: {
        title: "अपने कागज़ात इकट्ठा करें",
        pill: "कागज़ात",
        what: [
          "अधिकारी जो कागज़ माँग सकते हैं, वे इकट्ठा करें।",
          "दिखाएँ कि आपका जीवन {home} में है: परिवार, घर या पेंशन।",
          "दिखाएँ कि आप वापस लौटेंगे।",
          "दिखाएँ कि यात्रा का खर्च कैसे उठाया जाएगा।",
          "U.S. में परिवार का पत्र ज़रूरी नहीं है।",
        ],
        time: ["1 से 2 सप्ताह।"],
        simple: "ऐसे कागज़ात जुटाइए जो दिखाएँ कि आपका जीवन {home} में है और आप यात्रा के बाद लौटेंगे।",
      },
      es: {
        title: "Reúna sus documentos",
        pill: "Documentos",
        what: [
          "Reúna los papeles que el oficial puede pedir.",
          "Demuestre que su vida está en {home}: familia, vivienda o pensión.",
          "Demuestre que va a regresar a casa.",
          "Demuestre cómo se pagará el viaje.",
          "No hace falta una carta de familiares en U.S.",
        ],
        time: ["De 1 a 2 semanas."],
        simple: "Reúna papeles que muestren que su vida está en {home} y que volverá a casa después del viaje.",
      },
    },
    links: [
      { label: { en: "What the officer may ask for (official)", hi: "अधिकारी क्या माँग सकते हैं (आधिकारिक)", es: "Qué puede pedir el oficial (oficial)" }, url: LINKS.visitorVisa },
    ],
  },
  {
    id: "practice",
    documents: ["tripPlan", "lastStepPapers"],
    text: {
      en: {
        title: "Practice for the interview",
        pill: "Interview",
        what: [
          "Practice your answers out loud.",
          "Who will you visit?",
          "How long will you stay?",
          "Why will you come home?",
          "Answer honestly, in your own words. Keep it short.",
        ],
        time: ["A few evenings."],
        simple: "Practice saying your answers out loud.",
      },
      hi: {
        title: "इंटरव्यू की तैयारी करें",
        pill: "इंटरव्यू",
        what: [
          "अपने जवाब ज़ोर से बोलकर अभ्यास करें।",
          "आप किससे मिलेंगे?",
          "आप कितने समय रुकेंगे?",
          "आप घर क्यों लौटेंगे?",
          "सच्चाई से, अपने शब्दों में, छोटा जवाब दें।",
        ],
        time: ["कुछ शामें।"],
        simple: "अपने जवाब ज़ोर से बोलकर अभ्यास करें।",
      },
      es: {
        title: "Practique para la entrevista",
        pill: "Entrevista",
        what: [
          "Practique sus respuestas en voz alta.",
          "¿A quién va a visitar?",
          "¿Cuánto tiempo se quedará?",
          "¿Por qué va a regresar a casa?",
          "Responda con sinceridad, con sus propias palabras. Sea breve.",
        ],
        time: ["Unas cuantas tardes."],
        simple: "Practique decir sus respuestas en voz alta.",
      },
    },
    links: [
      { label: { en: "U.S. Embassy in {home}: visas", hi: "{home} में U.S. Embassy: वीज़ा", es: "U.S. Embassy en {home}: visas" }, url: LINKS.embassyIndia },
    ],
  },
  {
    id: "travel",
    documents: ["passportWithVisa", "flightDetails", "insurance"],
    text: {
      en: {
        title: "Book your flight",
        pill: "Flight",
        what: [
          "Wait until you have your visa and your passport is back.",
          "Then compare flights with the button above.",
          "Pick a flight with few stops and enough time to change planes.",
          "Ask the airline for wheelchair help if you need it.",
          "Think about travel insurance.",
        ],
        simple: "Buy tickets only after you have your visa. We help you compare flights.",
      },
      hi: {
        title: "अपनी उड़ान बुक करें",
        pill: "उड़ान",
        what: [
          "वीज़ा मिलने और पासपोर्ट वापस आने तक रुकें।",
          "फिर ऊपर दिए बटन से उड़ानों की तुलना करें।",
          "कम पड़ाव और विमान बदलने के लिए पर्याप्त समय वाली उड़ान चुनें।",
          "ज़रूरत हो तो एयरलाइन से व्हीलचेयर सहायता माँगें।",
          "यात्रा बीमा के बारे में सोचें।",
        ],
        simple: "वीज़ा मिलने के बाद ही टिकट खरीदें। हम उड़ानों की तुलना में मदद करते हैं।",
      },
      es: {
        title: "Reserve su vuelo",
        pill: "Vuelo",
        what: [
          "Espere hasta tener su visa y que le devuelvan el pasaporte.",
          "Luego compare vuelos con el botón de arriba.",
          "Elija un vuelo con pocas escalas y tiempo suficiente para cambiar de avión.",
          "Pida ayuda con silla de ruedas a la aerolínea si la necesita.",
          "Piense en un seguro de viaje.",
        ],
        simple: "Compre los boletos solo después de tener su visa. Le ayudamos a comparar vuelos.",
      },
    },
    action: {
      label: { en: "Find and compare flights", hi: "उड़ानें खोजें और तुलना करें", es: "Buscar y comparar vuelos" },
      href: "/flights",
    },
    links: [{ label: { en: "Official visitor visa page", hi: "आधिकारिक आगंतुक वीज़ा पृष्ठ", es: "Página oficial de la visa de visitante" }, url: LINKS.visitorVisa }],
  },
  {
    id: "arrive",
    documents: ["passportWithVisa", "stayAddress", "tripDetails"],
    text: {
      en: {
        title: "Arrive in the US and go through customs",
        pill: "Arrival",
        what: [
          "Keep your passport, visa and trip details ready.",
          "A U.S. border officer ([[cbp|CBP]]) checks you at the airport.",
          "The officer decides if you can enter, and for how long.",
          "A visa does not guarantee entry.",
          "Your leave date is on your [[i94|I-94]] record.",
        ],
        simple: "Keep your papers ready. The officer decides how long you can stay.",
      },
      hi: {
        // DRAFT: needs a native Hindi reader.
        title: "U.S. पहुँचें और कस्टम्स से गुज़रें",
        pill: "पहुँचना",
        what: [
          "पासपोर्ट, वीज़ा और यात्रा की जानकारी तैयार रखें।",
          "हवाई अड्डे पर U.S. सीमा अधिकारी ([[cbp|CBP]]) आपकी जाँच करते हैं।",
          "अधिकारी तय करते हैं कि आप प्रवेश कर सकते हैं या नहीं, और कितने समय के लिए।",
          "वीज़ा से प्रवेश की गारंटी नहीं मिलती।",
          "लौटने की तारीख आपके [[i94|I-94]] रिकॉर्ड में होती है।",
        ],
        simple: "कागज़ात तैयार रखें। अधिकारी तय करते हैं कि आप कितने दिन रुक सकते हैं।",
      },
      es: {
        // DRAFT: needs a fluent Spanish reader.
        title: "Llegue a U.S. y pase por la aduana",
        pill: "Llegada",
        what: [
          "Tenga a mano su pasaporte, su visa y los datos de su viaje.",
          "Un oficial de la frontera de U.S. ([[cbp|CBP]]) lo revisa en el aeropuerto.",
          "El oficial decide si puede entrar y por cuánto tiempo.",
          "La visa no garantiza la entrada.",
          "Su fecha de salida está en su registro [[i94|I-94]].",
        ],
        simple: "Tenga sus papeles listos. El oficial decide cuánto tiempo puede quedarse.",
      },
    },
    links: [
      { label: { en: "CBP: information for visitors", hi: "CBP: आगंतुकों के लिए जानकारी", es: "CBP: información para visitantes" }, url: LINKS.cbpVisitors },
      { label: { en: "Look up your I-94", hi: "अपना I-94 देखें", es: "Consulte su I-94" }, url: LINKS.i94 },
    ],
  },
  {
    id: "return",
    documents: ["i94", "returnTicket"],
    text: {
      en: {
        title: "Return on time",
        pill: "Return",
        what: [
          "Leave the U.S. by the date on your [[i94|I-94]] record.",
          "Do not work during your visit.",
          "Staying too long can cancel your visa.",
          "Want to stay longer? Read the rules before that date.",
        ],
        cost: ["Asking to stay longer may cost a fee.", "Ask [[uscis|USCIS]] about the fee."],
        simple: "Go home on time. Do not work.",
      },
      hi: {
        title: "समय पर लौटें",
        pill: "वापसी",
        what: [
          "[[i94|I-94]] रिकॉर्ड की तारीख तक U.S. छोड़ दें।",
          "यात्रा के दौरान काम न करें।",
          "ज़्यादा रुकने से वीज़ा रद्द हो सकता है।",
          "ज़्यादा रुकना है? उस तारीख से पहले नियम पढ़ें।",
        ],
        cost: ["ज़्यादा रुकने के आवेदन पर शुल्क लग सकता है।", "शुल्क के बारे में [[uscis|USCIS]] से पूछें।"],
        simple: "समय पर घर लौटें। काम न करें।",
      },
      es: {
        title: "Regrese a tiempo",
        pill: "Regreso",
        what: [
          "Salga de U.S. antes de la fecha de su registro [[i94|I-94]].",
          "No trabaje durante su visita.",
          "Quedarse demasiado puede cancelar su visa.",
          "¿Quiere quedarse más tiempo? Lea las reglas antes de esa fecha.",
        ],
        cost: ["Pedir más tiempo puede costar una tarifa.", "Pregunte a [[uscis|USCIS]] por la tarifa."],
        simple: "Regrese a casa a tiempo. No trabaje.",
      },
    },
    links: [
      { label: { en: "USCIS: extend your stay", hi: "USCIS: ठहराव बढ़ाना", es: "USCIS: extender su estadía" }, url: LINKS.uscisExtend },
      { label: { en: "Look up your I-94", hi: "अपना I-94 देखें", es: "Consulte su I-94" }, url: LINKS.i94 },
    ],
  }, {
    id: "i20",
    documents: ["i20Form"],
    links: [],
    text: {
      en: {
        title: "Receive your Form I-20",
        pill: "Form I-20",
        what: [
          "Once accepted, your U.S. university's international office will issue a Form I-20.",
          "Check that your name and birthdate exactly match your passport.",
          "You must have this document before you can pay your SEVIS fee or apply for a visa.",
        ],
        simple: "Wait for your U.S. university to send your official I-20 document.",
      },
      hi: {
        title: "अपना फॉर्म I-20 प्राप्त करें",
        pill: "फॉर्म I-20",
        what: [
          "स्वीकार किए जाने के बाद, आपका U.S. विश्वविद्यालय एक फॉर्म I-20 जारी करेगा।",
          "जांचें कि आपका नाम और जन्म तिथि आपके पासपोर्ट से बिल्कुल मेल खाते हैं।",
          "वीज़ा के लिए आवेदन करने या SEVIS शुल्क का भुगतान करने से पहले आपके पास यह दस्तावेज़ होना चाहिए।",
        ],
        simple: "अपने U.S. विश्वविद्यालय से आधिकारिक I-20 दस्तावेज़ आने की प्रतीक्षा करें।",
      },
      es: {
        title: "Reciba su Formulario I-20",
        pill: "Formulario I-20",
        what: [
          "Una vez aceptado, la oficina internacional de su universidad en U.S. le emitirá un Formulario I-20.",
          "Revise que su nombre y fecha de nacimiento coincidan exactamente con su pasaporte.",
          "Debe tener este documento antes de poder pagar la tarifa SEVIS o solicitar la visa.",
        ],
        simple: "Espere a que su universidad en U.S. le envíe su documento I-20 oficial.",
      },
    },
  },
  {
    id: "sevis",
    documents: ["sevisReceipt"],
    links: [
      { 
        url: "https://www.fmjfee.com/i901fee/index.html", 
        label: { en: "Pay SEVIS Fee (Official)", hi: "SEVIS शुल्क भरें (आधिकारिक)", es: "Pague la tarifa SEVIS (oficial)" } 
      }
    ],
    text: {
      en: {
        title: "Pay the SEVIS I-901 Fee",
        pill: "SEVIS fee",
        cost: ["$350 for F-1 students"],
        what: [
          "You must pay the SEVIS fee before applying for your visa.",
          "Go to the official FMJfee website to submit your payment.",
          "Keep the payment receipt and print it out, as you must bring it to your interview.",
        ],
        simple: "Pay your mandatory student tracking fee to the U.S. government.",
      },
      hi: {
        title: "SEVIS I-901 शुल्क भरें",
        pill: "SEVIS शुल्क",
        cost: ["F-1 छात्रों के लिए $350"],
        what: [
          "वीज़ा के लिए आवेदन करने से पहले आपको SEVIS शुल्क का भुगतान करना होगा।",
          "भुगतान करने के लिए आधिकारिक FMJfee वेबसाइट पर जाएं।",
          "भुगतान की रसीद संभाल कर रखें और उसका प्रिंट निकाल लें, इसे इंटरव्यू में ले जाना ज़रूरी है।",
        ],
        simple: "U.S. सरकार को अपना अनिवार्य छात्र ट्रैकिंग शुल्क भरें।",
      },
      es: {
        title: "Pague la tarifa SEVIS I-901",
        pill: "Tarifa SEVIS",
        cost: ["$350 para estudiantes F-1"],
        what: [
          "Debe pagar la tarifa SEVIS antes de solicitar su visa.",
          "Vaya al sitio web oficial de FMJfee para hacer su pago.",
          "Guarde el recibo del pago e imprímalo, porque debe llevarlo a su entrevista.",
        ],
        simple: "Pague al gobierno de U.S. la tarifa obligatoria de seguimiento de estudiantes.",
      },
    },
  },
  {
    id: "petition",
    documents: ["i797Notice"],
    links: [],
    text: {
      en: {
        title: "Wait for I-797 Approval",
        pill: "Approval",
        what: [
          "Your U.S. employer must file an I-129 petition with USCIS on your behalf.",
          "You cannot apply for your visa or schedule an interview until you receive the approved Form I-797 Notice of Action.",
          "Coordinate with your employer's immigration lawyer for updates.",
        ],
        simple: "Wait for your employer's petition to be approved by USCIS.",
      },
      hi: {
        title: "I-797 स्वीकृति की प्रतीक्षा करें",
        pill: "स्वीकृति",
        what: [
          "आपका U.S. नियोक्ता आपकी ओर से USCIS में I-129 याचिका दायर करेगा।",
          "जब तक आपको स्वीकृत फॉर्म I-797 नोटिस नहीं मिल जाता, तब तक आप वीज़ा आवेदन या इंटरव्यू बुक नहीं कर सकते।",
          "अपडेट के लिए अपने नियोक्ता के इमिग्रेशन वकील से संपर्क में रहें।",
        ],
        simple: "USCIS द्वारा आपके नियोक्ता की याचिका स्वीकृत होने की प्रतीक्षा करें।",
      },
      es: {
        title: "Espere la aprobación del I-797",
        pill: "Aprobación",
        what: [
          "Su empleador en U.S. debe presentar una petición I-129 ante USCIS en su nombre.",
          "No puede solicitar su visa ni programar una entrevista hasta recibir el Aviso de Acción I-797 aprobado.",
          "Hable con el abogado de inmigración de su empleador para recibir novedades.",
        ],
        simple: "Espere a que USCIS apruebe la petición de su empleador.",
      },
    },
  },
];

export const STEP_BY_ID: Record<StepId, StepContent> = Object.fromEntries(
  STEPS.map((s) => [s.id, s]),
) as Record<StepId, StepContent>;
