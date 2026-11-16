# Classroom Seat Reservation

A low-code web app designed for schools: a minimal-overhead-cost system for booking
seats in designated classrooms for specialized curriculum assessments, including
assessments for students with IEPs. Built on Google Workspace (Apps Script, Sheets,
and Calendar) — teachers reserve seats, student accommodations sync automatically,
and proctors run live timers, attendance, and rest breaks from one dashboard.

## What it does

- **Booking portal for teachers** — pick a date and period, see a live 22-seat map,
  and reserve a seat for a student. Bookings are written to a shared sheet and to a
  testing-centre calendar, and can be cancelled from the same portal.
- **Accommodations, looked up automatically** — typing a student's name pulls their
  accommodations from the master sheet, so the booking carries the right supports:
  extra time (applied as a multiplier to the test duration), rest breaks, a scribe,
  a calculator, or a function calculator.
- **Timetables that fit the programme** — period times follow the school's schedule,
  with separate MYP and DP timetables (including an Early Start slot), and a booking
  automatically works out which periods it occupies.
- **Proctor dashboard** — live per-seat timers, attendance status, test stop times,
  and rest-break flags for the day's bookings, with timer state saved back to the sheet.
- **Accommodations sync** — a menu command in the sheet syncs the master
  accommodations roster into the app's `Student_Accommodations` tab.
- **Staff-only access** — the portal is restricted to an authorized staff list;
  anyone else sees an access-denied message.

## The Safe Exam Browser Code field

Some students have a laptop accommodation and take assessments in a locked browser.
The booking form and the proctor dashboard carry a "Safe Exam Browser Code" field for
that code, so proctors can see it alongside the student's accommodations.

## How it's built

- **Platform:** Google Apps Script (web app, `America/Toronto` timezone)
- **Data:** Google Sheets — `Active_Bookings`, `Student_Accommodations`,
  `Proctor_Logs`, `Authorized_Staff`
- **Calendar:** Google Calendar — each booking creates a calendar event for its seat
- **Files:** `Code.gs` (backend), `Index.html` (booking portal),
  `Admin.html` (proctor dashboard), `appsscript.json` (manifest)

## How I build

I build with AI-assisted development ("vibe coding"): I prompt — then AI builds.
I review, refine, and refactor the code. Then I ship it.

## Setup (for a school adopting this)

1. Create a Google Sheet with the tabs above, and a Google Calendar for the
   testing centre.
2. In `Code.gs`, set `TARGET_CALENDAR_ID` to that calendar and
   `SOURCE_SHEET_ID` to the master accommodations sheet
   (currently the placeholder `REPLACE_WITH_YOUR_SOURCE_SHEET_ID`).
3. Add your staff to the authorized-staff list in `Code.gs`
   (currently `@example.edu` dummy addresses).
4. Deploy the Apps Script project as a web app and share it with staff.
5. Run **Testing Centre Tools → Sync Master Accommodations** from the sheet menu
   to load the accommodations roster.

## Privacy note

This is a sanitized showcase clone. All school identifiers, staff emails, the source
Sheet ID, and school branding from the original were replaced with dummy values, and
the code contains no student names, student data, API keys, or tokens. Use mock data
only — never real student records — when demonstrating it. A ready-made fictional
dataset (sample students, accommodations, and bookings) is in
[mock-data.md](mock-data.md).

## Licence

MIT — see the [LICENSE](LICENSE) file.
