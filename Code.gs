/**
* Testing Centre Seat Reservation System - Backend Logic (sanitized showcase version)
*/


const TARGET_CALENDAR_ID = "testingcentre@example.edu";


// MASTER ADMIN LIST: Authorized Proctor emails (all lowercase)
var ADMIN_EMAILS = [
 'staff.coordinator@example.edu',
 'staff.admin@example.edu',
 'staff.member1@example.edu',
 'testingcentre@example.edu',
 'staff.member2@example.edu',
 'staff.member3@example.edu',
 'staff.member4@example.edu',
 'staff.member5@example.edu',
 'staff.supply1@example.edu',
 'staff.supply2@example.edu',
 'staff.member6@example.edu',
 'staff.member7@example.edu',
 'staff.supply3@example.edu'
];


function isAuthorizedStaff(email) {
 if (!email) return false;
 var cleanEmail = email.toLowerCase().trim();
 if (ADMIN_EMAILS.indexOf(cleanEmail) !== -1) return true;
  try {
   var ss = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = ss.getSheetByName('Authorized_Staff');
   if (!sheet) return false;
  
   var data = sheet.getDataRange().getDisplayValues();
   for (var i = 1; i < data.length; i++) {
     if (String(data[i][0] || '').toLowerCase().trim() === cleanEmail) return true;
   }
 } catch (err) {
   console.log("Error checking Authorized_Staff sheet: " + err.message);
 }
 return false;
}


function doGet(e) {
 var page = e && e.parameter && e.parameter.page ? e.parameter.page.toLowerCase() : 'index';
 var currentUser = Session.getActiveUser().getEmail().toLowerCase();


 if (!currentUser) {
   return HtmlService.createHtmlOutput(
     '<div style="font-family: sans-serif; padding: 40px; text-align: center; color: #1F4E79;">' +
     '<h2>⛔ Authentication Required</h2><p>Please ensure you are logged into your official @example.edu Google account.</p></div>'
   );
 }


 if (page === 'admin' || page === 'proctor') {
   if (ADMIN_EMAILS.indexOf(currentUser) === -1) {
     return HtmlService.createHtmlOutput(
       '<div style="font-family: sans-serif; padding: 40px; text-align: center; color: #1F4E79;">' +
       '<h2>⛔ Access Denied</h2><p>You do not have administrative permission to view the Proctor Dashboard.</p></div>'
     );
   }
   return HtmlService.createTemplateFromFile('Admin')
     .evaluate()
     .setTitle('Example School Testing Centre - Proctor Dashboard')
     .addMetaTag('viewport', 'width=device-width, initial-scale=1')
     .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
 }
  if (!isAuthorizedStaff(currentUser)) {
   return HtmlService.createHtmlOutput(
     '<div style="font-family: sans-serif; padding: 40px; text-align: center; color: #1F4E79; max-width: 600px; margin: 40px auto; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">' +
     '<h2 style="color: #9B2226; margin-top: 0;">⛔ Restricted Access</h2>' +
     '<p style="font-size: 16px; color: #334155; line-height: 1.5;">The Testing Centre Seat Reservation Portal is restricted to authorized faculty and staff members.</p></div>'
   );
 }


 return HtmlService.createTemplateFromFile('Index')
   .evaluate()
   .setTitle('Example School Testing Centre - Booking Portal')
   .addMetaTag('viewport', 'width=device-width, initial-scale=1')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function searchStudentAccommodations(typedName) {
 const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student_Accommodations");
 const data = sheet.getDataRange().getDisplayValues();
 return data.filter(row => row[1].toLowerCase().includes(typedName.toLowerCase()));
}


function getTimetable(dateString, program) {
 const parts = dateString.split('-');
 const d = new Date(parts[0], parts[1] - 1, parts[2]);
 const dayOfWeek = d.getDay();
 let schedule = [];


 if (dayOfWeek === 3) {
   schedule = [
     { period: "Early Start", start: "8:15", end: "9:30" },
     { period: "Period 1", start: "9:30", end: "10:40"},
     { period: "Period 2", start: "11:10", end: "12:20" },
     { period: "Period 3", start: "13:10", end: "14:20" },
     { period: "Period 4", start: "14:20", end: "15:40" }
   ];
 } else {
   if (program === "MYP") {
     schedule = [
       { period: "Period 1", start: "8:30", end: "9:45" },
       { period: "Period 2", start: "10:30", end: "11:45" },
       { period: "Period 3", start: "12:15", end: "13:30" },
       { period: "Period 4", start: "14:15", end: "15:40" }
     ];
   } else {
     schedule = [
       { period: "Period 1", start: "8:30", end: "9:45" },
       { period: "Period 2", start: "10:30", end: "11:45" },
       { period: "Period 3", start: "11:45", end: "13:00"},
       { period: "Period 4", start: "14:15", end: "15:40" }
     ];
   }
 }
 return schedule;
}


function calculatePeriodsOccupied(dateString, startTime, baseDuration, multiplier, program) {
 const activeSchedule = getTimetable(dateString, program);
 const startSlot = activeSchedule.find(slot => slot.period === startTime);
 if (!startSlot) return startTime;
  const startMinutes = timeToMinutes(startSlot.start);
 const totalDuration = Math.round(baseDuration * multiplier);
 const endMinutes = startMinutes + totalDuration;
  let occupiedPeriodsList = [];
 activeSchedule.forEach(slot => {
   let pStart = timeToMinutes(slot.start);
   let pEnd = timeToMinutes(slot.end);
   if (startMinutes < pEnd && endMinutes > pStart) {
     occupiedPeriodsList.push(slot.period);
   }
 });
 return occupiedPeriodsList.join(", ");
}


function saveBooking(details) {
 var lock = LockService.getScriptLock();
 try {
   lock.waitLock(10000);
 } catch (e) {
   return { success: false, message: "Server busy. Please try reserving again." };
 }
  try {
   var ss = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = ss.getSheetByName("Active_Bookings");
   var userEmail = Session.getActiveUser().getEmail().toLowerCase();
  
   var periodsOccupied = calculatePeriodsOccupied(details.date, details.startTime, details.baseDuration, details.multiplier, details.program);
   var teacherWithEmail = details.teacher.trim() + " [" + userEmail + "]";
   var calendarEventId = "";
  
   try {
     var calendar = CalendarApp.getCalendarById(TARGET_CALENDAR_ID) || CalendarApp.getDefaultCalendar();
     var activeSchedule = getTimetable(details.date, details.program);
     var startSlot = activeSchedule.find(slot => slot.period === details.startTime);
     var startParts = startSlot ? startSlot.start.split(':') : ["8", "30"];
     var dateParts = details.date.split('-');
     var startDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], parseInt(startParts[0], 10), parseInt(startParts[1], 10));
     var totalDuration = Math.round(details.baseDuration * details.multiplier);
     var endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);
    
     var eventTitle = '[Seat ' + details.seatId + '] ' + (details.subject || 'Assessment') + ' - ' + details.studentName;
     var eventDescription = 'Testing Centre Assessment Reservation\n' +
       '• Seat Assigned: Seat ' + details.seatId + '\n' +
       '• Student: ' + details.studentName + '\n' +
       '• Course / Subject: ' + (details.subject || 'N/A') + '\n' +
       '• Period(s): ' + periodsOccupied + '\n' +
       '• Proctor / Teacher: ' + details.teacher + '\n' +
       '• Special Notes / Provisions: ' + (details.comments || 'None');
      
     var guestsList = userEmail;
     if (details.studentEmail && details.studentEmail.trim() !== "") guestsList += "," + details.studentEmail.trim();
    
     var event = calendar.createEvent(eventTitle, startDateTime, endDateTime, {
       location: "Example School - Testing Centre",
       description: eventDescription,
       guests: guestsList,
       sendInvites: true
     });
     calendarEventId = event.getId();
   } catch (calError) {
     console.log("Calendar Error: " + calError.message);
   }
  
   var newRow = [
     details.date, details.seatId, details.studentName, details.baseDuration,
     details.startTime, periodsOccupied, teacherWithEmail, details.subject || "",
     details.examCode || "", details.comments || "", calendarEventId,
     "Pending", ""
   ];
   sheet.appendRow(newRow);
   return { success: true };
 } finally {
   lock.releaseLock();
 }
}


function getBookingStatus(dateString) {
 const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Active_Bookings");
 const displayData = sheet.getDataRange().getDisplayValues();
 const activeUserEmail = Session.getActiveUser().getEmail().toLowerCase();
 const isAdmin = ADMIN_EMAILS.indexOf(activeUserEmail) !== -1;
  if (displayData.length <= 1) return { bookings: [], currentUser: activeUserEmail, isAdmin: isAdmin };
 displayData.shift();
 const filteredBookings = displayData.filter(row => row[0].toString().trim() === dateString.trim());
  return { bookings: filteredBookings, currentUser: activeUserEmail, isAdmin: isAdmin };
}


function cancelBooking(dateString, seatId, period) {
 const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Active_Bookings");
 const displayData = sheet.getDataRange().getDisplayValues();
 const activeUserEmail = Session.getActiveUser().getEmail().toLowerCase();
 const isAdmin = ADMIN_EMAILS.indexOf(activeUserEmail) !== -1;
  for (let i = displayData.length - 1; i >= 1; i--) {
   const rowDateStr = displayData[i][0].toString().trim();
   const rowSeatId = displayData[i][1].toString().trim();
   const rowPeriods = displayData[i][5] ? displayData[i][5].toString() : "";
   const rowTeacherInfo = displayData[i][6].toString().toLowerCase().trim();
   const calendarEventId = displayData[i][10] ? displayData[i][10].toString().trim() : "";
  
   if (rowDateStr === dateString.trim() && rowSeatId === seatId.trim() && rowPeriods.includes(period)) {
     if (rowTeacherInfo.includes("[" + activeUserEmail + "]") || isAdmin) {
       if (calendarEventId !== "") {
         try {
           var calendar = CalendarApp.getCalendarById(TARGET_CALENDAR_ID) || CalendarApp.getDefaultCalendar();
           var event = calendar.getEventById(calendarEventId);
           if (event) event.deleteEvent();
         } catch (calError) {}
       }
       sheet.deleteRow(i + 1);
       return "Success";
     } else {
       return "Unauthorized";
     }
   }
 }
 return "Not Found";
}


function findExactBookingRowIndex(sheet, targetDate, seatId, studentName) {
 var data = sheet.getDataRange().getValues();
 var displayData = sheet.getDataRange().getDisplayValues();
 var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
 var cleanTargetDate = String(targetDate).trim();
 var cleanSeat = String(seatId).trim();
 var cleanStudent = String(studentName).trim().toLowerCase();


 for (var i = 1; i < data.length; i++) {
   var row = data[i];
   if (!row[0]) continue;
  
   var rowDateDisplay = String(displayData[i][0]).trim();
   var rowDateFormatted = row[0] instanceof Date ? Utilities.formatDate(row[0], tz, "yyyy-MM-dd") : "";
   var isDateMatch = (rowDateDisplay === cleanTargetDate || rowDateFormatted === cleanTargetDate);


   if (isDateMatch && String(row[1]).trim() === cleanSeat && String(row[2]).trim().toLowerCase() === cleanStudent) {
     return i + 1;
   }
 }
 return -1;
}


// BULLETPROOF FETCH ENGINE: Strips native Date objects to prevent network serialization crashes.
function getAdminPeriodBookings(targetDate, period, cacheBuster) {
 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var sheet = ss.getSheetByName('Active_Bookings');
 if (!sheet) return [];
  var accMap = {};
 var accSheet = ss.getSheetByName('Student_Accommodations');
 if (accSheet) {
   var accData = accSheet.getDataRange().getDisplayValues();
   for (var k = 1; k < accData.length; k++) {
     var sName = String(accData[k][1] || '').trim().toLowerCase();
     var sAcc = String(accData[k][4] || '').trim();
     var rawMult = parseFloat(accData[k][3]);
     var mult = (!isNaN(rawMult) && rawMult > 0) ? (rawMult >= 10 ? 1 + (rawMult / 100) : rawMult) : 1.0;
     if (sName) accMap[sName] = { accText: sAcc, multiplier: mult };
   }
 }


 var data = sheet.getDataRange().getValues();
 var displayData = sheet.getDataRange().getDisplayValues();
 var tz = ss.getSpreadsheetTimeZone();
 var results = [];
  var p = String(period).toLowerCase().replace(/\s+/g, '');
 var targetPeriodStr = p === "earlystart" ? "earlystart" : (p.match(/^[1-4]$/) ? "period" + p : p);
  for (var i = 1; i < data.length; i++) {
   var row = data[i];
   if (!row[0]) continue;
  
   // Aggressive date matching to bypass timezone drift
   var rowDateDisplay = String(displayData[i][0]).trim();
   var parsedRowDate = "";
   if (row[0] instanceof Date) {
     parsedRowDate = Utilities.formatDate(row[0], tz, "yyyy-MM-dd");
   } else {
     var d = new Date(row[0]);
     if (!isNaN(d.getTime())) {
       var altDate = Utilities.formatDate(d, tz, "yyyy-MM-dd");
       if (altDate === targetDate) parsedRowDate = altDate;
     }
   }
   var isDateMatch = (rowDateDisplay === targetDate || parsedRowDate === targetDate);
   var periodsOccupied = String(row[5]).toLowerCase().replace(/\s+/g, '');
  
   if (isDateMatch && periodsOccupied.indexOf(targetPeriodStr) !== -1) {
     var sStudentName = String(row[2] || '').trim();
     var cleanSeat = String(row[1]).trim();
     var uniqueId = cleanSeat + "_" + sStudentName.replace(/[^a-zA-Z0-9]/g, '');
    
     var accInfo = accMap[sStudentName.toLowerCase()] || { accText: '', multiplier: 1.0 };
     var accText = "No Accommodations Listed";
     if (accInfo.accText && accInfo.accText.toLowerCase() !== 'none' && accInfo.accText.toLowerCase() !== 'n/a' && accInfo.accText.toLowerCase() !== 'null') {
       accText = accInfo.accText.replace(/\n/g, '<br>');
     }
    
     var hasRestBreak = accInfo.accText.toLowerCase().indexOf('rest break') !== -1 || accInfo.accText.toLowerCase().indexOf('rest breaks') !== -1;
     var baseMins = parseInt(row[3], 10);
     var durationMinutes = (!isNaN(baseMins) && baseMins > 0) ? Math.round(baseMins * accInfo.multiplier) : 45;
    
     var timerData = null;
     var rawTimerState = row[13] ? String(row[13]) : '';
     if (rawTimerState && rawTimerState !== "undefined") {
       try { timerData = JSON.parse(rawTimerState); } catch (e) { timerData = null; }
     }
    
     // ABSOLUTE STRING ENFORCEMENT: Guarantees no native objects crash the network transmission
     results.push({
       uniqueId: String(uniqueId),
       date: String(targetDate),
       seatId: String(cleanSeat),
       studentName: String(sStudentName),
       startTime: String(displayData[i][3] || row[3] || ''),
       endTime: String(displayData[i][4] || row[4] || ''),
       periodsOccupied: String(row[5] || ''),
       teacher: String(row[6] || ''),
       subject: String(row[7] || ''),
       examCode: String(row[8] || 'N/A'),
       comments: String(row[9] || ''),
       calendarId: String(row[10] || ''),
       attendance: String(row[11] || 'Pending'),
       actualStopTime: String(row[12] || ''),
       durationMinutes: durationMinutes,
       accommodations: String(accText),
       hasRestBreak: hasRestBreak,
       timerData: timerData
     });
   }
 }
 return results;
}


function saveTimerStateBackend(date, seatId, studentName, timerDataStr, actionLogMsg) {
 try {
   var ss = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = ss.getSheetByName('Active_Bookings');
   if (!sheet) return { success: false };


   var realRowIndex = findExactBookingRowIndex(sheet, date, seatId, studentName);
   if (realRowIndex === -1) return { success: false, error: "Booking row not found" };


   var headerCell = sheet.getRange(1, 14);
   if (!headerCell.getValue()) headerCell.setValue('Timer State Data');


   if (timerDataStr === "RESET" || timerDataStr === "" || timerDataStr === "null") {
     sheet.getRange(realRowIndex, 14).setValue("");
     sheet.getRange(realRowIndex, 13).setValue("");
   } else {
     sheet.getRange(realRowIndex, 14).setValue(timerDataStr);
   }
  
   if (actionLogMsg) {
     var logSheet = ss.getSheetByName("Proctor_Logs");
     if (!logSheet) {
       logSheet = ss.insertSheet("Proctor_Logs");
       logSheet.appendRow(["Timestamp", "Proctor Email", "Assessment Date", "Seat ID", "Student Name", "Action Taken"]);
       logSheet.getRange("A1:F1").setFontWeight("bold");
     }
     logSheet.appendRow([new Date(), Session.getActiveUser().getEmail().toLowerCase(), date, seatId, studentName, actionLogMsg]);
   }
   return { success: true };
 } catch (e) {
   return { success: false, error: e.message };
 }
}


function updateAttendanceStatus(date, seatId, studentName, newStatus) {
 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var sheet = ss.getSheetByName('Active_Bookings');
 var realRowIndex = findExactBookingRowIndex(sheet, date, seatId, studentName);
 if (realRowIndex !== -1) sheet.getRange(realRowIndex, 12).setValue(newStatus);
 return { success: true, status: newStatus };
}


function recordTestStopTime(date, seatId, studentName, stopTimeStr) {
 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var sheet = ss.getSheetByName('Active_Bookings');
 var realRowIndex = findExactBookingRowIndex(sheet, date, seatId, studentName);
 if (realRowIndex !== -1) {
   var headerCell = sheet.getRange(1, 13);
   if (!headerCell.getValue()) headerCell.setValue('Actual Stop Time');
   sheet.getRange(realRowIndex, 13).setValue(stopTimeStr);
 }
}


function timeToMinutes(timeStr) {
 const parts = String(timeStr).split(':');
 let hours = parseInt(parts[0], 10);
 const minutes = parseInt(parts[1], 10);
 if (hours < 7) hours += 12;
 return hours * 60 + minutes;
}
function parseTimeToMinutes(timeStr) {
 if (!timeStr) return 0;
 var match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
 if (!match) return 0;
 var hours = parseInt(match[1], 10);
 var mins = parseInt(match[2], 10);
 var ampm = match[3];
 if (ampm) {
   ampm = ampm.toUpperCase();
   if (ampm === 'PM' && hours < 12) hours += 12;
   if (ampm === 'AM' && hours === 12) hours = 0;
 }
 return hours * 60 + mins;
}


// =========================================================================
// ACCOMMODATIONS SYNC ENGINE
// =========================================================================


function onOpen() {
 SpreadsheetApp.getUi().createMenu('⚙️ Testing Centre Tools').addItem('Sync Master Accommodations', 'syncAccommodationsData').addToUi();
}


function syncAccommodationsData() {
 var destSS = SpreadsheetApp.getActiveSpreadsheet();
 var destSheet = destSS.getSheetByName("Student_Accommodations");
  // Confirmed working ID
 var SOURCE_SHEET_ID = "REPLACE_WITH_YOUR_SOURCE_SHEET_ID";
  try {
   var sourceSS = SpreadsheetApp.openById(SOURCE_SHEET_ID);
   var sourceSheet = sourceSS.getSheetByName("Testing Accommodations | YYYY/YYYY");
   if (!sourceSheet) sourceSheet = sourceSS.getSheets()[0];
  
   var sourceData = sourceSheet.getDataRange().getValues();
   var accMap = {};
  
   // Aggressive normalization helper: strips ALL spaces, commas, and special characters
   function normalizeName(str) {
     return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
   }
  
   for (var i = 1; i < sourceData.length; i++) {
     var row = sourceData[i];
     var rawName = String(row[0]).trim();
     if (!rawName) continue;
    
     var matchKey = normalizeName(rawName); // Creates indestructible lookup key
    
     var extraTimeRaw = parseInt(row[7], 10);
     var multiplier = "";
     if (!isNaN(extraTimeRaw) && extraTimeRaw > 0) multiplier = 1 + (extraTimeRaw / 100);
    
     var notesArray = [];
     if (String(row[8]).trim().toUpperCase() === "X") notesArray.push("Laptop");
     if (String(row[9]).trim().toUpperCase() === "X") notesArray.push("Spell Check");
     if (String(row[10]).trim().toUpperCase() === "X") notesArray.push("Four Function Calculator");
     if (String(row[11]).trim().toUpperCase() === "X") notesArray.push("Speech to Text");
     if (String(row[12]).trim().toUpperCase() === "X") notesArray.push("Scribe");
     if (String(row[13]).trim().toUpperCase() === "X") notesArray.push("Quiet Space");
     if (String(row[14]).trim().toUpperCase() === "X") notesArray.push("Rest Breaks");
    
     var accString = notesArray.join(", ");
     var additionalComments = String(row[15]).trim();
     var finalNotes = accString;
     if (additionalComments !== "") finalNotes = (finalNotes !== "") ? finalNotes + "\n\nNotes: " + additionalComments : "Notes: " + additionalComments;
    
     accMap[matchKey] = { mult: multiplier, notes: finalNotes };
   }
  
   var destData = destSheet.getDataRange().getValues();
   var numRows = destData.length;
   var maxCols = Math.max(destData[0].length, 5);
  
   for (var j = 0; j < numRows; j++) {
     while (destData[j].length < maxCols) destData[j].push("");
   }
  
   for (var j = 1; j < numRows; j++) {
     var rawDestName = String(destData[j][1]).trim();
     if (!rawDestName) continue;
    
     var destMatchKey = normalizeName(rawDestName); // Compare using indestructible key
    
     if (accMap[destMatchKey]) {
       destData[j][3] = accMap[destMatchKey].mult;  
       destData[j][4] = accMap[destMatchKey].notes; 
     } else {
       destData[j][3] = "";
       destData[j][4] = "";
     }
   }
  
   destSheet.getRange(1, 1, numRows, maxCols).setValues(destData);
  
   try { SpreadsheetApp.getUi().alert("Sync Complete", "Successfully mapped master roster.", SpreadsheetApp.getUi().ButtonSet.OK); } catch (uiError) {}
 } catch (e) {
   try { SpreadsheetApp.getUi().alert("Sync Failed", "Error: " + e.message, SpreadsheetApp.getUi().ButtonSet.OK); } catch (uiError) { console.error(e.message); }
 }
}
