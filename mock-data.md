# Classroom Seat Reservation — Mock data

All names, emails and codes below are fictional, created for demonstration only.
Use mock data only — never real student records — when demonstrating this app.
Sample date: **Wednesday, 2027-02-03** (a Wednesday, so the Early Start slot applies).

Periods Occupied were calculated with the app's own `calculatePeriodsOccupied`
logic against the Wednesday timetable in `Code.gs` (Early Start 8:15–9:30,
Period 1 9:30–10:40, Period 2 11:10–12:20, Period 3 13:10–14:20,
Period 4 14:20–15:40), and verified on 2026-11-16.

## How to use it

1. Create a Google Sheet with the four tabs below, using the header rows exactly
   as shown — the code reads columns by position, not by header name.
2. Paste each table into its tab (headers in row 1).
3. In `Code.gs`, set `TARGET_CALENDAR_ID` to your testing-centre calendar and
   `SOURCE_SHEET_ID` to your master accommodations sheet
   (currently the placeholder `REPLACE_WITH_YOUR_SOURCE_SHEET_ID`).
4. Add your staff to the authorized-staff list in `Code.gs`
   (currently `@example.edu` dummy addresses).
5. Deploy as a web app and open the booking portal for 2027-02-03 to see the
   sample day: 5 bookings across Seats 1, 3, 7, 12 and 18, with the other
   17 seats free.

## 1. Student_Accommodations

Columns, by position in `Code.gs`: [0] Student ID, [1] Student Name,
[2] Programme, [3] Extra-Time Multiplier, [4] Accommodations.
`searchStudentAccommodations` matches on column 1; `getAdminPeriodBookings`
reads the multiplier from column 3 and the text from column 4.

| Student ID | Student Name | Programme | Extra-Time Multiplier | Accommodations |
|---|---|---|---|---|
| EX-1001 | Jamie Rivera | MYP | 1.5 | Extra Time 50%, Rest Breaks |
| EX-1002 | Sam Chen | DP | 1 | None |
| EX-1003 | Alex Okafor | DP | 1.25 | Extra Time 25%, Scribe |
| EX-1004 | Sofia Garcia | MYP | 1 | Laptop, Four Function Calculator |
| EX-1005 | Noah Kim | MYP | 1 | Rest Breaks |
| EX-1006 | Taylor Brooks | DP | 1.5 | Extra Time 50%, Quiet Space |

## 2. Active_Bookings

Columns, by position in `saveBooking` (`Code.gs`): [0] Date, [1] Seat,
[2] Student Name, [3] Base Duration (min), [4] Start Period,
[5] Periods Occupied, [6] Teacher, [7] Subject, [8] Safe Exam Browser Code,
[9] Comments, [10] Calendar Event ID, [11] Attendance,
[12] Actual Stop Time, [13] Timer State Data.

Calendar Event IDs are left blank here — they are filled in by `saveBooking`
when a booking is made through the portal.

| Date | Seat | Student Name | Base Duration (min) | Start Period | Periods Occupied | Teacher | Subject | Safe Exam Browser Code | Comments | Calendar Event ID | Attendance | Actual Stop Time | Timer State Data |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2027-02-03 | 3 | Jamie Rivera | 60 | Early Start | Early Start, Period 1 | Jordan Lee [staff.coordinator@example.edu] | Mathematics |  | Extra time 50% — ends 09:45 |  | Pending |  |  |
| 2027-02-03 | 7 | Sam Chen | 45 | Period 2 | Period 2 | Jordan Lee [staff.coordinator@example.edu] | English |  |  |  | Pending |  |  |
| 2027-02-03 | 12 | Alex Okafor | 75 | Period 3 | Period 3, Period 4 | Priya Nair [staff.member1@example.edu] | Science |  | Scribe required; extra time 25% — ends 14:44 |  | Pending |  |  |
| 2027-02-03 | 18 | Sofia Garcia | 45 | Period 4 | Period 4 | Priya Nair [staff.member1@example.edu] | French | SEB-2027-0418 | Laptop accommodation — locked browser |  | Pending |  |  |
| 2027-02-03 | 1 | Noah Kim | 60 | Period 1 | Period 1 | Jordan Lee [staff.coordinator@example.edu] | History |  | Rest breaks as needed |  | Pending |  |  |

Worked examples: Jamie Rivera, 60 min × 1.5 = 90 min, 08:15–09:45, so
Early Start + Period 1. Alex Okafor, 75 min × 1.25 = 94 min (rounded),
13:10–14:44, so Period 3 + Period 4.

## 3. Authorized_Staff

One email per row, column A. These match the dummy `@example.edu` addresses
already in `Code.gs`.

| Email |
|---|
| staff.coordinator@example.edu |
| staff.member1@example.edu |
| testingcentre@example.edu |

## 4. Proctor_Logs

Columns, by position in `saveTimerStateBackend` (`Code.gs`):
Timestamp, Proctor Email, Assessment Date, Seat ID, Student Name, Action Taken.
Created by the app when a proctor acts — the rows below are what two sample
entries look like after the fact.

| Timestamp | Proctor Email | Assessment Date | Seat ID | Student Name | Action Taken |
|---|---|---|---|---|---|
| 2027-02-03 08:15:00 | staff.coordinator@example.edu | 2027-02-03 | 3 | Jamie Rivera | Timer started for Period 1 |
| 2027-02-03 11:10:00 | staff.coordinator@example.edu | 2027-02-03 | 7 | Sam Chen | Marked Present |

## Still open for the showcase

- Screenshots — a booking-portal screenshot and a proctor-dashboard screenshot
  using only this mock data. These need a deployed copy of the app; they
  cannot be made from the code files alone.
- Repo — Michael approved MIT and told Muse to create the GitHub repo
  `classroom-seat-reservation` on 2026-11-16. Add this file to that repo
  once the repo exists, so a visitor can recreate the sample day.
