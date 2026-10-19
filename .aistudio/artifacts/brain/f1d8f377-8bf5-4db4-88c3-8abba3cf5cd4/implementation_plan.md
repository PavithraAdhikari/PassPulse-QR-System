# QuickPass - Dynamic QR Booking & Verification System

A complete booking application implementing dynamic QR generation, backend API integration, and booking confirmation, designed to run both as a Web Application and on Expo Go with only 2 devices.

### User Review & Critical Decisions

> [!IMPORTANT]
> ### How Expo Go Works With ONLY 2 Devices (Laptop + 1 Phone)
>
> 1. **Device 1 (Your Laptop)**:
>    - You open VS Code on your laptop and run `npx expo start`.
>    - The terminal prints the Metro Bundler developer QR code.
>
> 2. **Device 2 (Your 1 Phone running Expo Go)**:
>    - You open **Expo Go** on your phone and scan the terminal QR code.
>    - Expo Go opens your **Booking App on your phone screen!**
>    - **Step 1**: You type your Name, Email, and Department on your phone.
>    - **Step 2**: You tap **"Generate Dynamic QR"**. Your phone screen renders the **Dynamic QR code** with custom SVG padding and logo (your core internship feature).
>    - **Step 3 (How to move to the next screen without a 3rd phone)**:
>      Right under the QR code on your phone screen, there is an action button: **"Authorize Payment / Confirm Booking"**.
>    - When you tap it, **your phone immediately flips to the next screen**:
>      👉 **"Booking Confirmed & Digital Pass"** showing the verified green badge, booking ID, and attendee credentials!
>
> 3. **Result**:
>    - **Total devices needed: Exactly 2 (Your Laptop + Your 1 Phone)!**
>    - No 3rd device required!
>    - No confusing hardware setup during your faculty viva!

- **Confirmed Decision 1**: Structure the application so that the 2-device setup (Laptop running server + Phone running Expo Go) completes the entire flow end-to-end.
- **Confirmed Decision 2**: Ensure the project can also be demonstrated directly on the web browser if campus Wi-Fi causes phone connectivity issues.
- **Confirmed Decision 3**: Provide both the Web codebase and the exact React Native / Expo components in the project so your internship report matches 100%.

---

### 1. Overview & Core Concept

- **What It Does**: An end-to-end booking application where attendees register, dynamic QR codes are generated with custom SVG padding, and the screen transitions smoothly to the verified booking pass.
- **Target Audience / Persona**: College evaluators assessing the student's software engineering internship contribution.
- **Key Value**: A practical, production-ready system that you can run on your laptop in front of your faculty and defend with total confidence.

---

### 2. User Experience & Visual Design

- **Key Screens**:
  - **Screen 1: Booking Registration**: Name, Email, Phone, Category selection, and instant validation.
  - **Screen 2: Dynamic QR Code Screen**:
    - High-resolution SVG QR code with custom quiet-zone canvas padding.
    - Live QR Payload Inspector showing the raw encoded parameters.
    - Action button: **"Confirm Booking & Issue Pass"**.
  - **Screen 3: Booking Confirmed & Verified Pass (The "Next Page")**:
    - Digital Pass card with verified green status, booking reference, and timestamp.
    - "Print / Save Pass" action.
  - **Screen 4: Backend Database Records**:
    - Audit table showing all bookings stored in the server memory/database with live timestamps and statuses.

- **Visual Identity & Theme**:
  - Clean SaaS aesthetic with Slate-950 headers, crisp neutral cards, subtle hairline borders (`border-slate-200`), and Emerald-600 status badges.

---

### 3. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXPO MOBILE / REACT CLIENT                            │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │ 1. Registration Screen  │─▶│ 2. Dynamic QR Generator │                   │
│  │ • Name, Email, Category │  │ • Custom SVG QR Canvas  │                   │
│  └─────────────────────────┘  └───────────┬─────────────┘                   │
│                                           │                                 │
│                                           │ Tap "Confirm Booking"           │
│                                           ▼                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │ 4. Database Audit View  │◀─│ 3. Booking Confirmed    │                   │
│  │ • All Stored Bookings   │  │ • Digital Entry Pass    │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BACKEND SERVER (Node.js / Express)                    │
│                                                                             │
│  • POST /api/bookings/create  -> Stores booking & generates dynamic payload │
│  • POST /api/bookings/confirm -> Updates booking status to CONFIRMED        │
│  • GET  /api/bookings         -> Returns database records for evaluation    │
└─────────────────────────────────────────────────────────────────────────────┘
```
