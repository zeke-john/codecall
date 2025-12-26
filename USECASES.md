## Real World Example -> Medical Records Agent

To understand the difference, let's walk through the same task using both approaches.

### The Scenario

**Agent**: Medical records assistant for a clinic  
**User Question**: "Find all diabetic patients who haven't had an A1C test in the last 6 months and send them appointment reminders"

### Available Tools

```typescript
// Patient Management
getPatients(); // Returns all patients in the system
getPatientById(patientId); // Returns a single patient record
searchPatients(query); // Search patients by name, condition, etc.

// Medical Records
getLabResults(patientId); // Returns lab history for a patient
getMedications(patientId); // Returns current medications
getVisitHistory(patientId); // Returns past appointments
getDiagnoses(patientId); // Returns diagnosis codes (ICD-10)

// Communications
sendAppointmentReminder(patientId, message); // Sends SMS/email reminder
sendSecureMessage(patientId, message); // Sends message to patient portal

// Chart Management
flagForFollowUp(patientId, reason); // Flags chart for nurse review
```

## Traditional Tool Calling

### Turn 1

**Tokens in context**: 4,500 (system prompt + 10 tool definitions)

**AI decides**: "I need to get all patients first"

```typescript
{ "tool": "getPatients", "params": {} }
```

**System executes and returns 847 patients into context**:

```typescript
[
  {
    id: "P001",
    name: "John Smith",
    conditions: ["diabetes", "hypertension"],
    email: "john@...",
  },
  { id: "P002", name: "Sarah Lee", conditions: ["asthma"], email: "sarah@..." },
  {
    id: "P003",
    name: "Mike Chen",
    conditions: ["diabetes"],
    email: "mike@...",
  },
  // ... 844 more patients
];
```

**Tokens now**: 4,500 + 85,000 (patient data) = **89,500 tokens**

### Turn 2

**AI scans the 847 patients in context**, tries to identify diabetic ones (127 patients).

**AI decides**: "I'll check lab results for the first diabetic patient"

```typescript
{ "tool": "getLabResults", "params": { "patientId": "P001" } }
```

**System returns**:

```typescript
[
  { test: "A1C", value: 6.8, date: "2025-03-15" },
  { test: "Cholesterol", value: 195, date: "2025-04-01" },
  // ... more labs
];
```

**Tokens now**: 89,500 + 2,500 = **92,000 tokens**

### Turn 3

**AI decides**: "P001 had A1C in March, that's recent. Check next diabetic patient."

```typescript
{ "tool": "getLabResults", "params": { "patientId": "P003" } }
```

**Tokens now**: 92,000 + 2,500 = **94,500 tokens**

### Turns 4–129

Repeat for remaining 125 diabetic patients. Each turn:

- Full conversation history sent to AI provider
- AI processes response, picks next patient
- Gets lab results back, adds to context

**Tokens after checking all diabetic patients**: ~420,000 tokens

### Turns 130–152

23 patients need reminders. AI sends them one at a time.

**Turn 130**:

```typescript
{ "tool": "sendAppointmentReminder", "params": {
  "patientId": "P003",
  "message": "Hi Mike, you're due for your A1C test. Please schedule an appointment."
}}
```

**Turn 131**:

```typescript
{ "tool": "sendAppointmentReminder", "params": {
  "patientId": "P017",
  "message": "Hi Lisa, you're due for your A1C test. Please schedule an appointment."
}}
```

_... repeat 21 more times_

### Traditional Approach: Final Tally

| Metric                   | Value                                     |
| ------------------------ | ----------------------------------------- |
| Total inference passes   | 152                                       |
| Total tokens processed   | ~450,000                                  |
| Cost (at $15/1M tokens)  | ~$6.75                                    |
| Data sent to AI provider | All 847 patient records + all lab results |
| Filtering accuracy       | AI scans list manually (can miss entries) |

## Codecall Approach

### Turn 1 (Only Turn)

**Tokens in context**: 1,800 (system prompt + SDK file tree)

**AI sees the SDK structure**:

```
/tools
  /patients
    getPatients.ts           → () => Patient[]
    getPatientById.ts        → (patientId: string) => Patient
    searchPatients.ts        → (query: string) => Patient[]
  /records
    getLabResults.ts         → (patientId: string) => LabResult[]
    getMedications.ts        → (patientId: string) => Medication[]
    getVisitHistory.ts       → (patientId: string) => Visit[]
    getDiagnoses.ts          → (patientId: string) => Diagnosis[]
  /communications
    sendAppointmentReminder.ts → (patientId: string, message: string) => void
    sendSecureMessage.ts       → (patientId: string, message: string) => void
  /charts
    flagForFollowUp.ts       → (patientId: string, reason: string) => void
```

**AI writes code**:

```typescript
const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 6);

// Get all patients
const patients = await tools.patients.getPatients();

// Filter to diabetic patients
const diabeticPatients = patients.filter((p) =>
  p.conditions.includes("diabetes")
);

// Check each for recent A1C
const needsReminder = [];

for (const patient of diabeticPatients) {
  const labs = await tools.records.getLabResults(patient.id);
  const recentA1C = labs.find(
    (lab) => lab.test === "A1C" && new Date(lab.date) > SIX_MONTHS_AGO
  );

  if (!recentA1C) {
    needsReminder.push(patient);
  }
}

// Send reminders
for (const patient of needsReminder) {
  await tools.communications.sendAppointmentReminder(
    patient.id,
    `Hi ${
      patient.name.split(" ")[0]
    }, you're due for your A1C test. Please schedule an appointment.`
  );
}

return {
  totalDiabetic: diabeticPatients.length,
  remindersSent: needsReminder.length,
  patients: needsReminder.map((p) => p.name),
};
```

### Sandbox Executes

All of this happens **inside the sandbox**, not through the AI:

1. Fetches 847 patients (stays in sandbox memory)
2. Filters to 127 diabetic patients (deterministic code, not AI scanning)
3. Loops through each, checks lab results
4. Identifies 23 patients needing reminders
5. Sends 23 reminders
6. Returns only the summary

### AI Receives Final Result

```typescript
{
  "totalDiabetic": 127,
  "remindersSent": 23,
  "patients": ["Mike Chen", "Lisa Park", "Tom Wilson", "..."]
}
```

**AI responds to user**:

> "Done! I found 127 diabetic patients in the system. 23 of them haven't had an A1C test in the past 6 months, so I sent each of them an appointment reminder."

### Codecall Approach: Final Tally

| Metric                   | Value              |
| ------------------------ | ------------------ |
| Total inference passes   | 1                  |
| Total tokens processed   | ~2,500             |
| Cost (at $15/1M tokens)  | ~$0.04             |
| Data sent to AI provider | Only final summary |
| Filtering accuracy       | 100% (code)        |

## Side-by-Side Comparison

|                           | Traditional        | Codecall         |
| ------------------------- | ------------------ | ---------------- |
| **Inference passes**      | 152                | 1                |
| **Tokens**                | ~450,000           | ~2,500           |
| **Cost**                  | $6.75              | $0.04            |
| **Patient data exposure** | All records hit AI | Stays in sandbox |
| **Filtering accuracy**    | Model-dependent    | 100% (code)      |

**Result**: 99.4% token reduction, 170x cheaper, MUCH faster, and sensitive patient data never leaves your infra

---

## Multi Turn Conversations

Codecall works exactly like a normal agent for back-and-forth conversations. Each user message triggers a new code execution. The AI still sees conversation history and can ask clarifying questions.

### The Scenario

**Agent**: Same medical records assistant  
**User wants to explore the data and make decisions based on what they find**

### Turn 1

**User**: "How many diabetic patients do we have?"

**AI writes code**:

```typescript
const patients = await tools.patients.getPatients();
const diabetic = patients.filter((p) => p.conditions.includes("diabetes"));

return {
  total: patients.length,
  diabetic: diabetic.length,
  percentage: ((diabetic.length / patients.length) * 100).toFixed(1),
};
```

**Sandbox returns**:

```typescript
{ "total": 847, "diabetic": 127, "percentage": "15.0" }
```

**AI responds**: "You have 847 total patients, 127 of which are diabetic (15.0%)."

### Turn 2

**User**: "Which ones haven't visited in over a year?"

**AI writes code**:

```typescript
const ONE_YEAR_AGO = new Date();
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);

const patients = await tools.patients.getPatients();
const diabetic = patients.filter((p) => p.conditions.includes("diabetes"));

const needsVisit = [];

for (const patient of diabetic) {
  const visits = await tools.records.getVisitHistory(patient.id);
  const lastVisit = visits.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )[0];

  if (!lastVisit || new Date(lastVisit.date) < ONE_YEAR_AGO) {
    needsVisit.push({
      name: patient.name,
      lastVisit: lastVisit?.date || "Never",
    });
  }
}

return {
  count: needsVisit.length,
  patients: needsVisit,
};
```

**Sandbox returns**:

```typescript
{
  "count": 34,
  "patients": [
    { "name": "Mike Chen", "lastVisit": "2024-08-15" },
    { "name": "Lisa Park", "lastVisit": "2024-06-02" },
    { "name": "Tom Wilson", "lastVisit": "Never" },
    // ... 31 more
  ]
}
```

**AI responds**: "34 diabetic patients haven't visited in over a year. Here's the list: Mike Chen (last visit Aug 2024), Lisa Park (June 2024), Tom Wilson (never visited)..."

### Turn 3

**User**: "Yikes, Tom never visited? What's his info?"

**AI writes code**:

```typescript
const patient = await tools.patients.searchPatients("Tom Wilson");
const tom = patient[0];

const medications = await tools.records.getMedications(tom.id);
const diagnoses = await tools.records.getDiagnoses(tom.id);

return {
  name: tom.name,
  email: tom.email,
  phone: tom.phone,
  conditions: tom.conditions,
  diagnoses: diagnoses,
  currentMedications: medications.filter((m) => m.active),
};
```

**Sandbox returns**:

```typescript
{
  "name": "Tom Wilson",
  "email": "tom.wilson@email.com",
  "phone": "555-0123",
  "conditions": ["diabetes", "obesity"],
  "diagnoses": [
    { "code": "E11.9", "description": "Type 2 diabetes without complications" },
    { "code": "E66.9", "description": "Obesity, unspecified" }
  ],
  "currentMedications": [
    { "name": "Metformin", "dosage": "500mg", "frequency": "2x daily" }
  ]
}
```

**AI responds**: "Tom Wilson has Type 2 diabetes and obesity. He's on Metformin 500mg twice daily but has never come in for a visit. His contact: tom.wilson@email.com, 555-0123."

### Turn 4

**User**: "Flag him for urgent follow-up and send him a message to schedule ASAP"

**AI writes code**:

```typescript
const patient = await tools.patients.searchPatients("Tom Wilson");
const tom = patient[0];

await tools.charts.flagForFollowUp(
  tom.id,
  "URGENT: Diabetic patient on Metformin with no visit history. Needs immediate appointment."
);

await tools.communications.sendSecureMessage(
  tom.id,
  `Hi Tom, this is ${clinicName}. We noticed you haven't been in for a check-up yet. ` +
    `As a diabetic patient on medication, regular monitoring is important. ` +
    `Please call us at 555-CLINIC or reply to this message to schedule an appointment as soon as possible.`
);

return {
  flagged: true,
  messageSent: true,
  patientId: tom.id,
};
```

**Sandbox returns**:

```typescript
{ "flagged": true, "messageSent": true, "patientId": "P089" }
```

**AI responds**: "Done. I've flagged Tom Wilson for urgent follow-up and sent him a secure message asking him to schedule an appointment ASAP."

### Turn 5

**User**: "Actually, do this for all 34 of those patients who haven't visited"

**AI writes code**:

```typescript
const ONE_YEAR_AGO = new Date();
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);

const patients = await tools.patients.getPatients();
const diabetic = patients.filter((p) => p.conditions.includes("diabetes"));

const flagged = [];

for (const patient of diabetic) {
  const visits = await tools.records.getVisitHistory(patient.id);
  const lastVisit = visits.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )[0];

  if (!lastVisit || new Date(lastVisit.date) < ONE_YEAR_AGO) {
    await tools.charts.flagForFollowUp(
      patient.id,
      `Diabetic patient with no visit in 12+ months. Last visit: ${
        lastVisit?.date || "Never"
      }`
    );

    await tools.communications.sendSecureMessage(
      patient.id,
      `Hi ${patient.name.split(" ")[0]}, this is ${clinicName}. ` +
        `We noticed it's been a while since your last visit. ` +
        `As a diabetic patient, regular check-ups help us keep you healthy. ` +
        `Please call us at 555-CLINIC to schedule an appointment.`
    );

    flagged.push(patient.name);
  }
}

return {
  totalFlagged: flagged.length,
  totalMessaged: flagged.length,
  patients: flagged,
};
```

**Sandbox returns**:

```typescript
{
  "totalFlagged": 34,
  "totalMessaged": 34,
  "patients": ["Mike Chen", "Lisa Park", "Tom Wilson", "..."]
}
```

**AI responds**: "Done! I've flagged all 34 patients for follow-up and sent each of them a personalized message to schedule an appointment."

## Summary

This was a normal conversation. The user explored data, asked follow-up questions, made decisions, and took action. Codecall handled each turn:

| Turn      | User Intent                  | Traditional Calls | Codecall      |
| --------- | ---------------------------- | ----------------- | ------------- |
| 1         | Count diabetic patients      | 1                 | 1 script      |
| 2         | Find those missing visits    | 128 (1 + 127)     | 1 script      |
| 3         | Get details on one patient   | 3                 | 1 script      |
| 4         | Flag and message one patient | 2                 | 1 script      |
| 5         | Do it for all 34             | 68 (34 x 2)       | 1 script      |
| **Total** |                              | **202 calls**     | **5 scripts** |

The conversation flow and the user experience are very similar. But behind the scenes:

- Traditional: 202 inference passes, ~450k tokens
- Codecall: 5 inference passes, ~8k tokens
