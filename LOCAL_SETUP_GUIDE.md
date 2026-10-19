# PassPulse: Local Setup & Viva Presentation Guide

This guide explains how to run this complete full-stack project on your **Windows 11 laptop in VS Code** on `localhost`, and how to present it directly to your faculty.

---

## 1. Running Locally on Your Laptop (Windows 11 / VS Code)

### Prerequisites:
* **Node.js** (v18 or higher)
* **VS Code** (Visual Studio Code)

### Steps to Run:
1. **Download / Copy Project Files**:
   Create a folder on your laptop (e.g., `C:\Users\YourName\Projects\passpulse`) and place all the project files into it.

2. **Open in VS Code**:
   * Open VS Code.
   * Go to **File > Open Folder...** and select `passpulse`.

3. **Open Terminal in VS Code**:
   * Press `Ctrl + ~` to open the terminal.

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Start Full-Stack Server**:
   ```bash
   npm run dev
   ```

6. **Open in Browser**:
   Navigate to:
   ```text
   http://localhost:3000
   ```

---

## 2. Complete Project Architecture (Role-Based Access Control)

The system is cleanly divided into two secure portals:

### A. The Public Attendee Portal (What Students See)
1. **Event Registration Form**:
   * Student enters Name, Email, and Department.
   * Student selects from **Official Campus Events** (e.g., *National Tech Symposium 2026*, *Web & Mobile Hackathon*). Fake events like "abc" cannot be submitted.
   * Clicks **"Generate Dynamic Entry Pass"**.

2. **Dynamic QR Generation (Your Core Internship Feature)**:
   * The backend signs a cryptographic SHA-256 token and unique booking reference (`BK-2026-XXXX`).
   * The screen renders the high-contrast **Dynamic QR Code** with custom quiet-zone canvas padding.
   * The student clicks **"Confirm & Issue Entry Pass"**.

3. **Confirmed Digital Pass & Receipt**:
   * The pass status updates to `AUTHENTICATED` in the backend database.
   * Displays the official printable boarding pass with venue location, check-in QR, and print button.

---

### B. The Protected Staff & Organizer Portal
* Accessed via the **"Staff Portal"** button in the header (Passcode: `2026`).
* **Feature 1: Gatekeeper Scanner (Optical Camera Scanner)**:
  * Staff clicks **"Open Camera Scanner"**, which activates the device camera with a live targeting box.
  * Point the camera at any attendee's QR code (on phone or printed paper).
  * **First Scan**: ✅ **"ACCESS GRANTED"** (Welcome Pavithra, CS Dept, Checked-in at timestamp).
  * **Duplicate Scan (Anti-Passback)**: ⚠️ **"DUPLICATE ENTRY DETECTED"** (Pass already used at timestamp! Entry Denied).
  * Also supports direct reference input (e.g. `BK-2026-8921`) if the camera is unavailable.
* **Feature 2: Authorized Events Manager**:
  * Staff can click **"+ Add Official Event"** to add new legitimate events (e.g. *Robotics Championship*).
  * Only authorized events appear in the student registration dropdown.
* **Feature 3: Attendee Registry & Audit Log**:
  * Real-time table of all registered students, timestamps, and check-in statuses with JSON export.
