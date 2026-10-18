# Document search eval

Run on 2026-10-18T02:10:51.368Z with `npm run eval`. Questions: [questions.json](questions.json).

**Source hit 12/12 · Only .gov 12/12 · No hits 3/3 · Mentions 12/12 · median 0.3s**

| Question | Source hit | Only .gov | No hits | Mentions | Latency |
|---|---|---|---|---|---|
| `en-fee` What is the visa fee? | ✅ | ✅ | – | ✅ | 0.6s |
| `en-photo-size` What photo size do I need? | ✅ | ✅ | – | ✅ | 0.3s |
| `en-b2-stay-length` How long can I stay on a B-2? | ✅ | ✅ | – | ✅ | 0.3s |
| `en-extend-stay` How do I extend my stay? | ✅ | ✅ | – | ✅ | 0.2s |
| `en-what-is-i94` What is an I-94? | ✅ | ✅ | – | ✅ | 0.3s |
| `en-interview-documents` What should I bring to the interview? | ✅ | ✅ | – | ✅ | 0.3s |
| `en-hyderabad-wait` How do I find wait times? | ✅ | ✅ | – | ✅ | 0.4s |
| `en-invitation-letter` Do I need an invitation letter? | ✅ | ✅ | – | ✅ | 0.3s |
| `hi-fee` वीज़ा की फीस कितनी है? | ✅ | ✅ | – | ✅ | 0.3s |
| `hi-extend-stay` मैं अपना ठहराव कैसे बढ़ाऊँ? | ✅ | ✅ | – | ✅ | 0.3s |
| `hi-what-is-i94` I-94 क्या है? | ✅ | ✅ | – | ✅ | 0.3s |
| `hi-interview-documents` इंटरव्यू में मुझे क्या-क्या लेकर जाना चाहिए? | ✅ | ✅ | – | ✅ | 0.2s |
| `none-off-topic` What is the best restaurant in Gainesville? | – | – | ✅ | – | 0.3s |
| `none-off-topic` How is traffic right now? | – | – | ✅ | – | 0.3s |
| `none-off-topic` Where is my package? | – | – | ✅ | – | 0.3s |

– means the check does not apply to that question.

## Results

### en-fee

> What is the visa fee?

- 0.723 [Fees for Visa Services](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html)
- 0.710 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)
- 0.694 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)
- 0.691 [Fees for Visa Services](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html)

### en-photo-size

> What photo size do I need?

- 0.663 [Photo Requirements](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html)
- 0.645 [Photo Requirements](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html)
- 0.618 [Students and Employment](https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment)

### en-b2-stay-length

> How long can I stay on a B-2?

- 0.669 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)
- 0.645 [I-94 FAQs](https://i94.cbp.dhs.gov/help)
- 0.640 [Official ESTA Application](https://esta.cbp.dhs.gov/)
- 0.627 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)

### en-extend-stay

> How do I extend my stay?

- 0.708 [I-94 FAQs](https://i94.cbp.dhs.gov/help)
- 0.703 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)
- 0.697 [Extend Your Stay](https://www.uscis.gov/visit-the-united-states/extend-your-stay)
- 0.694 [Extend Your Stay](https://www.uscis.gov/visit-the-united-states/extend-your-stay)

### en-what-is-i94

> What is an I-94?

- 0.748 [I-94 FAQs](https://i94.cbp.dhs.gov/help)
- 0.732 [I-94 FAQs](https://i94.cbp.dhs.gov/help)
- 0.671 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)
- 0.671 [Nonimmigrant Visas (U.S. Embassy India)](https://in.usembassy.gov/nonimmigrant-visas/)

### en-interview-documents

> What should I bring to the interview?

- 0.660 [Immigrant Visa Process - Step 10: Prepare for the Interview](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-10-prepare-for-the-interview.html)
- 0.655 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)
- 0.623 [Immigrant Visa Process - Step 10: Prepare for the Interview](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-10-prepare-for-the-interview.html)
- 0.618 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)

### en-hyderabad-wait

> How do I find wait times?

- 0.647 [Visa Appointment Wait Times](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html)
- 0.646 [Visa Appointment Wait Times](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html)

### en-invitation-letter

> Do I need an invitation letter?

- 0.641 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)
- 0.633 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)
- 0.623 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)

### hi-fee

> वीज़ा की फीस कितनी है?

- 0.700 [Fees for Visa Services](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html)
- 0.678 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)
- 0.672 [Fees for Visa Services](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html)
- 0.664 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)

### hi-extend-stay

> मैं अपना ठहराव कैसे बढ़ाऊँ?

- 0.635 [Extend Your Stay](https://www.uscis.gov/visit-the-united-states/extend-your-stay)
- 0.626 [Extend Your Stay](https://www.uscis.gov/visit-the-united-states/extend-your-stay)
- 0.623 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)
- 0.617 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)

### hi-what-is-i94

> I-94 क्या है?

- 0.735 [I-94 FAQs](https://i94.cbp.dhs.gov/help)
- 0.730 [I-94 FAQs](https://i94.cbp.dhs.gov/help)
- 0.699 [Nonimmigrant Visas (U.S. Embassy India)](https://in.usembassy.gov/nonimmigrant-visas/)
- 0.682 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)

### hi-interview-documents

> इंटरव्यू में मुझे क्या-क्या लेकर जाना चाहिए?

- 0.690 [Immigrant Visa Process - Step 10: Prepare for the Interview](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-10-prepare-for-the-interview.html)
- 0.667 [Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html)
- 0.660 [Immigrant Visa Process - Step 10: Prepare for the Interview](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-10-prepare-for-the-interview.html)
- 0.652 [Exchange Visitor Visa](https://travel.state.gov/content/travel/en/us-visas/study/exchange.html)

### none-off-topic

> What is the best restaurant in Gainesville?

_No results._

### none-off-topic

> How is traffic right now?

_No results._

### none-off-topic

> Where is my package?

_No results._
