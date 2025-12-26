## Real-World Example: Medical Records Agent

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
