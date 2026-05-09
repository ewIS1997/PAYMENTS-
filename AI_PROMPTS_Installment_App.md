# AI Execution Prompts
## Installment & Collection Management Web Application
### 4 Prompts — One Per Phase

---

## PROMPT 1 OF 4 — Project Foundation, Authentication, and Navigation Shell

You are building a web application for managing installment customers and monthly payment collection. This is Phase 1 of a 4-phase build. Your job in this phase is to set up the complete project foundation, connect it to Firebase, implement user authentication, and build the full navigation shell that all future screens will live inside. By the end of this phase, the application should be fully deployable, a user should be able to log in and out, and the main navigation should be functional with placeholder content on each screen.

---

### Context and System Description

The application is a cloud-connected single-page web app. It has no traditional backend server. All data is stored in Firebase Firestore. All authentication is handled by Firebase Authentication. The frontend is built with React and styled with Tailwind CSS. The entire interface is in Arabic and must use a right-to-left (RTL) layout throughout. The application is used by 1 to 3 staff members who manage installment contracts and field collection for a retail business in Egypt. The currency is Egyptian Pounds (EGP). The primary use case is: register customers, create installment contracts, generate receipts, and record collection results.

---

### What You Must Build in This Phase

**Step 1 — Firebase Project Configuration**

Create and configure the Firebase integration for the application. The application needs two Firebase services connected and initialized: Firestore as the database and Firebase Authentication for user login. The Firebase configuration object containing the project credentials must be stored in a dedicated configuration file that all other parts of the application import from. This configuration file must read its values from environment variables, never from hardcoded strings, so that switching between a development and production Firebase project requires only changing environment variable values. The application must initialize Firebase exactly once on startup, and this initialization must happen before any other part of the application attempts to read or write data.

**Step 2 — Firestore Collections and Initial Settings Document**

The Firestore database needs five collections: customers, contracts, installments, receipts, and settings. You do not need to create these programmatically — Firestore creates collections automatically when the first document is written. However, you must create the settings document manually or programmatically during initial setup. The settings document has a fixed, known document ID so the application can always read it without querying. The settings document must contain the following fields from the start: shop_name as an empty string, logo_url as an empty string, last_receipt_number as the integer zero, receipt_prefix as the string "RCPT", and receipt_year as the current year as an integer. This document is the only document in the entire application that has a fixed ID rather than an auto-generated one.

**Step 3 — Firestore Security Rules**

Write and deploy Firestore security rules that enforce the following access policy. All read and write access to all collections is completely denied by default. Authenticated users (those with a valid Firebase Auth session token) are allowed to read and write to the customers, contracts, installments, and receipts collections. Authenticated users are allowed to read the settings document. Only users with an admin custom claim are allowed to write to the settings document. Delete operations on the installments collection and the receipts collection are completely denied for all users, including admins, at the rule level. This is a hard guarantee that these records can never be removed, not even through the Firebase console by accident, unless the rules are explicitly changed. The rules must be written in Firestore's security rule language and stored in the firestore.rules file in the project root so they deploy alongside the application.

**Step 4 — Authentication Flow**

Build the complete authentication system. The login screen is the entry point for unauthenticated users. It contains a clean Arabic-language form with two fields: email address and password. The form has a single submit button labeled in Arabic. When the user submits valid credentials, they are logged in and redirected to the dashboard. When the user submits invalid credentials, a clear Arabic error message is shown below the form. The error message must be human-readable Arabic, not a raw Firebase error code. The login screen must not be accessible to already-authenticated users — if a logged-in user navigates to the login URL, they are immediately redirected to the dashboard.

The authentication state must be managed at the application root level using a React Context. This context listens to Firebase Auth's session state and makes the current user object available to all components throughout the application. Any page component that needs to know whether the user is logged in reads from this context rather than calling Firebase directly.

An authentication guard must wrap all protected routes. Any navigation to a protected route by a user who is not logged in must redirect to the login page immediately. The guard must handle the brief loading window between application startup and Firebase confirming the session state — during this window, the guard shows a loading indicator rather than flashing the login page for a fraction of a second before redirecting.

**Step 5 — Application Layout and Navigation Shell**

Build the persistent application shell that wraps all screens after login. The shell contains two parts: the main content area where page components render, and the navigation component.

The navigation component has two visual modes. On mobile screens (smaller than 768px wide), navigation appears as a fixed bottom tab bar with five icon-and-label tabs. On desktop screens (768px and wider), navigation appears as a fixed left sidebar with five labeled items. The five navigation destinations are: Home (the dashboard), Customers, Collection, Reports, and Settings.

The active navigation item must be visually distinct from inactive items — use a stronger color, a background highlight, or an underline, so the user always knows which section they are in. Navigation uses React Router for URL-based routing, meaning each section has its own URL path and the browser back button works correctly between sections.

All five destination screens must exist as placeholder pages at this stage. Each placeholder page shows the screen's Arabic title prominently and a brief Arabic note that this section is under construction. This is sufficient for Phase 1 — the actual screen content is built in later phases.

**Step 6 — Dashboard Placeholder with Summary Cards**

The dashboard is the first screen users see after login. At this phase, build the structural layout of the dashboard even though the cards will show placeholder data. The dashboard contains three large summary cards arranged in a row on desktop and stacked vertically on mobile. The three cards are: number of unpaid installments this month, total amount collected this month in EGP, and number of late customers. Each card has a large number in the center, a descriptive Arabic label below it, and a distinct background color or icon to differentiate the three cards visually. At this phase, all three cards display zero or a placeholder dash. The real data connection happens in Phase 2.

**Step 7 — Arabic and RTL Global Configuration**

Apply RTL and Arabic configuration at the root level of the application so that every screen, component, and form inherits it automatically. The HTML root element must have dir set to rtl and lang set to ar. The primary font for the entire application is Cairo, loaded from Google Fonts. The font must be declared in the global CSS so all text in the application uses it without needing to specify it component by component. The minimum body font size is 16px. Primary data fields such as customer names, amounts, and dates must use a font size of 20px or larger. All button labels must be large enough to tap comfortably on a phone screen without zooming.

**Step 8 — Hosting and Initial Deployment**

Configure Firebase Hosting so the application can be accessed via a live URL. The hosting configuration must specify that all URL paths that do not match a static file should serve the main HTML file, which is the standard configuration for single-page applications with client-side routing. Deploy the Phase 1 build to the development Firebase project hosting URL. Confirm that the following work correctly on the live URL: the login page loads, a valid user can log in, navigation between the five sections works, the logout button works, and the application loads correctly on a mobile phone browser.

---

### Acceptance Criteria for Phase 1

Before moving to Phase 2, confirm that all of the following are true. A user can open the live URL on a phone and on a desktop browser. The login form works with correct credentials and shows an Arabic error with incorrect credentials. After login, the user sees the dashboard with three placeholder cards. The bottom tab navigation works on mobile and the sidebar works on desktop. Clicking each of the five navigation items loads the corresponding placeholder page. The logout button ends the session and redirects to login. Refreshing the browser while logged in keeps the user logged in. Refreshing the browser while not logged in stays on the login page. The entire UI is in Arabic and all text is RTL aligned.

---

### Important Constraints

Do not build any data entry forms for customers, contracts, or installments in this phase. Do not connect the dashboard cards to real Firestore data yet. Do not implement receipt generation or printing. Do not build the collection screen logic. Keep every placeholder page extremely simple — just a title and a message. The goal of Phase 1 is a solid, deployed foundation, not visible features.

---
---

## PROMPT 2 OF 4 — Customer Management, Contract Creation, and Installment Generation

You are continuing the build of a web application for managing installment customers and monthly payment collection. Phase 1 is already complete. The application has a working login system, a navigation shell with five sections, a deployed live URL, and a Firestore database connected and secured. Your job in this phase is to build the complete customer management system, the contract creation system, and the automatic installment generation logic. By the end of this phase, a user should be able to add customers, create contracts, and see all generated installments displayed correctly on screen.

---

### Context Reminder

The application is in Arabic with RTL layout throughout. Currency is Egyptian Pounds (EGP). The database is Firebase Firestore with five collections: customers, contracts, installments, receipts, and settings. All UI text must be in Arabic. Font sizes must be large — minimum 16px for body text and 20px or larger for primary data. Cards and large tap targets are preferred over dense tables, especially on mobile.

---

### What You Must Build in This Phase

**Step 1 — Customer List Screen**

Replace the placeholder Customers page with the fully functional customer list screen. The screen shows all customers stored in Firestore, fetched in real time. Each customer is displayed as a card, not a table row. Each card shows the customer's full name in large text, their phone number, and their village name. Cards are tappable — tapping a customer card navigates to that customer's detail page.

At the top of the screen there is a search input field. As the user types in the search field, the customer list filters in real time to show only customers whose name or phone number contains the typed text. The filtering happens on the already-fetched data in memory, not by running a new Firestore query on every keystroke.

Below the search field there is a village filter. This is a dropdown or a horizontally scrollable row of chips showing all unique village names that exist among the current customers. Selecting a village filters the list to show only customers from that village. The village filter and the search filter work together — selecting a village and typing a name shows only customers from that village whose name matches the typed text.

At the bottom right of the screen (or top right for RTL, meaning the bottom left in physical position) there is a large floating button labeled in Arabic to add a new customer. On mobile this button must be at least 56px in height and width so it is easy to tap.

When no customers exist yet, the screen shows a centered Arabic message explaining that no customers have been added yet, with a button to add the first customer.

**Step 2 — Add Customer Screen**

Build the add customer form as a separate screen, not a modal or a drawer. The screen title in Arabic indicates this is the new customer form. The form contains the following fields: full name (required), phone number (required), village name (required), national ID number (optional), address (optional), and notes (optional). All field labels are in Arabic. All input fields use a large font size. Required fields are clearly marked.

The village field is a text input with autocomplete suggestions based on village names already stored in the customer collection. This is not a restricted dropdown — the user can type any new village name. As the user types, previously used village names that match appear as suggestions below the field, and the user can tap a suggestion to fill the field.

Validation runs when the user attempts to submit the form. If any required field is empty, an Arabic error message appears directly below that field. The form does not submit until all required fields are filled. On successful submission, the new customer document is written to Firestore and the user is navigated to the new customer's detail page.

**Step 3 — Customer Detail Screen**

Build the customer detail screen that opens when a customer card is tapped. The screen shows all customer information: name, phone, village, national ID, address, and notes. Below the customer information is a list of all contracts belonging to this customer.

Each contract in the list is displayed as a card showing the product name, the total amount in EGP, the monthly amount in EGP, the number of months, the start date, and a status badge. The status badge shows one of three states in Arabic with color coding: active (green), completed (gray), and late (red).

At the top right of the screen there is an edit button that navigates to the edit customer form. At the bottom of the screen there is a button to add a new contract for this customer.

If the customer has no contracts yet, the contracts section shows an Arabic message saying no contracts exist yet, with a button to create the first contract.

**Step 4 — Edit Customer Screen**

Build the edit customer screen. It is identical in layout to the add customer form but pre-populated with the customer's existing data. On submission, the customer document is updated in Firestore. The user is navigated back to the customer detail screen after a successful update.

Soft delete is implemented on this screen as a secondary action, clearly separated visually from the edit controls. A delete button is present but styled in red to signal danger. When tapped, a confirmation dialog appears in Arabic asking the user to confirm the deletion. The dialog must explain that deletion is permanent and cannot be undone. If the customer has any contracts linked to them, the delete button is disabled and replaced with an Arabic message explaining that customers with contracts cannot be deleted.

Soft delete works by setting an isDeleted boolean field to true on the customer document rather than physically removing the document. The customer list screen filters out documents where isDeleted is true.

**Step 5 — Add Contract Screen**

Build the add contract screen, accessible from the customer detail page. The screen title in Arabic indicates which customer the contract is being created for, showing the customer's name prominently.

The form contains the following fields: product name (required, text), total amount in EGP (required, number), monthly amount in EGP (required, number), number of months (required, integer), and start date (required, date). All field labels are in Arabic. Number fields use numeric input type so the phone's numeric keyboard appears automatically on mobile.

A read-only summary section below the form recalculates in real time as the user fills in the fields. The summary shows: the calculated end date based on start date and number of months, a confirmation that the product of monthly amount times number of months equals the total amount (or a warning if there is a small remainder), and how many installment documents will be generated.

On submission, the following must happen in a single atomic Firestore batch write operation. First, the contract document is written with all its fields, a status of active, and the customer ID as a reference field. Second, all installment documents are generated and written in the same batch. The batch write either succeeds completely or fails completely — there is no state where the contract exists without its installments.

**Step 6 — Installment Generation Algorithm**

The installment generation algorithm runs inside the add contract submission handler and produces the array of installment documents that are included in the batch write. The algorithm works as follows.

It reads the start date, monthly amount, total amount, and number of months from the contract form. It enters a loop that runs exactly number-of-months times. On each iteration, it calculates the due date for that installment. The due date is always the first day of a month. For the first installment, the due date is the first day of the same month as the start date. For each subsequent installment, the month increments by one. The algorithm handles year boundary correctly — if the start month is November, the next month is December, and the month after that is January of the following year with the year field incremented.

For all installments except the last, the amount is set to the monthly amount. For the last installment, the amount is set to the total amount minus the sum of all previous installments. This handles the case where the total amount does not divide evenly by the monthly amount, ensuring the sum of all installments always equals the total contract amount exactly.

Each installment document is built with the following fields: the contract ID, the customer ID copied from the contract, the due date as a Firestore Timestamp pointing to midnight on the first day of the due month, the amount, the status set to the string pending, payment date set to null, and receipt ID set to null.

**Step 7 — Contract Detail Screen**

Build the contract detail screen that opens when a contract card is tapped from the customer detail page. The screen shows the contract's full information at the top: product name, total amount, monthly amount, number of months, start date, end date, and status badge.

Below the contract information is the complete installment list. Each installment is displayed as a card showing the due month and year in Arabic (for example, يناير 2027 not 01/2027), the amount in EGP, and a status badge showing pending, paid, or late. Installments are listed in chronological order from earliest to latest.

Paid installments show the payment date below the status badge. Installments that have a linked receipt show a small receipt icon or label.

**Step 8 — Dashboard Data Connection**

Connect the three dashboard summary cards to real Firestore data. The first card shows the count of installment documents where status is pending and due date falls within the current calendar month. The second card shows the sum of amounts for installment documents where status is paid and payment date falls within the current calendar month. The third card shows the count of distinct customers who have at least one installment with status late. All three values must update automatically when the underlying data changes, without requiring a page refresh.

---

### Acceptance Criteria for Phase 2

Before moving to Phase 3, confirm all of the following. The customer list loads and shows all customers. Search by name filters the list correctly. Village filter works correctly. Adding a new customer saves to Firestore and opens the detail page. The village autocomplete shows previously used village names as suggestions. Editing a customer updates Firestore correctly. Deleting a customer with no contracts works. Deleting a customer with contracts shows the disabled state and explanation. Adding a contract generates exactly the correct number of installments. The sum of all installment amounts equals the contract total amount. The last installment handles the remainder correctly. All due dates land on the first of the correct month. Year boundary is handled correctly for contracts starting in October, November, or December. The contract detail screen lists all installments in order. The dashboard cards show real numbers.

---

### Important Constraints

Do not build the collection screen logic or receipt generation in this phase. Do not build the reports screen. Do not implement printing. Do not implement the settings screen. Stay focused on the customer-contract-installment data layer and its UI.

---
---

## PROMPT 3 OF 4 — Collection Screen, Receipt Generation, and Print System

You are continuing the build of a web application for managing installment customers and monthly payment collection. Phases 1 and 2 are complete. The application has authentication, navigation, customer management, contract creation, and automatic installment generation all working. Your job in this phase is to build the three most operationally critical features: the collection screen where field agents review and update installment statuses, the receipt generation system with sequential atomic numbering, and the print layout that produces 3 receipts per A4 page.

---

### Context Reminder

The application is in Arabic with RTL layout throughout. Currency is Egyptian Pounds (EGP). The database is Firebase Firestore. The key business rules for this phase are: one receipt per installment only, receipt numbers are sequential and never repeated, receipts are never deleted once created, and the receipt number counter increments atomically using a Firestore Transaction to prevent duplicates even when two users act simultaneously.

---

### What You Must Build in This Phase

**Step 1 — Collection Screen Layout and Filters**

Replace the placeholder Collection page with the fully functional collection screen. This screen is the operational heart of the application — field agents use it before going to collect payments to see who owes money in a specific village this month.

At the top of the screen there are two filter controls. The first filter is a village selector. It is a dropdown populated with all unique village names from the customers collection. The second filter is a month and year selector. It defaults to the current month and current year when the screen loads. The user can change the month backward or forward using arrow buttons, or select a specific month and year from a picker.

Below the filters, a prominent button labeled in Arabic triggers the search. When tapped, the application queries Firestore for all installments that match the selected village and selected month, joining each installment with its parent customer data.

The query works as follows. It fetches installments where the due date falls within the selected month and year, where the linked customer's village matches the selected village, and where the status is either pending or late. Paid installments are not shown on this screen.

**Step 2 — Collection Screen Results List**

The results of the collection query are displayed as a list of cards, one card per installment. Each card shows the customer's full name in large Arabic text, the customer's phone number, the product name from the linked contract, the installment amount in EGP in large text, and a status badge showing whether the installment is pending or late. Late installments must be visually distinguished from pending ones — use a red badge and a red left border on the card, or another clear visual treatment.

At the top of the results list, above the first card, there is a summary line in Arabic showing the total number of installments found, the total amount in EGP that these installments represent, and how many of them are marked late.

**Step 3 — Status Update Actions on Collection Screen**

Each installment card on the collection screen has two action buttons. The first button marks the installment as paid. The second button marks the installment as late. Both buttons must be large enough to tap reliably on a phone. When the user taps Mark as Paid, a confirmation dialog appears in Arabic asking the user to confirm. The dialog shows the customer name and amount so the user can verify they tapped the correct card. On confirmation, the installment document in Firestore is updated: status changes to paid, and payment date is set to today's date automatically. The card then disappears from the collection list since paid installments are not shown. When the user taps Mark as Late, no confirmation is needed since this is a lower-stakes action. The installment status changes to late immediately, and the card's visual style updates to the red late treatment without disappearing from the list.

**Step 4 — Receipt Selection on Collection Screen**

Below the filters and above the results list, add a receipt generation control section. This section appears only after a successful search that returns at least one installment.

There is a Select All checkbox or toggle at the top of the results list. When toggled on, all installment cards in the current results become selected. Individual cards can also be selected or deselected by tapping a checkbox on each card. The selection state of each card is visually obvious — selected cards have a highlighted border or background color.

A floating action bar appears at the bottom of the screen when at least one installment is selected. This bar shows how many installments are selected, the total amount of those installments in EGP, and a large button labeled Generate Receipts in Arabic.

**Step 5 — Receipt Generation Logic**

When the user taps Generate Receipts with one or more installments selected, the following process runs. First, a pre-generation check runs against Firestore to find any selected installments that already have a receipt linked to them, meaning their receipt_id field is not null. These already-receipted installments are removed from the generation set, and the user is shown an Arabic notice listing how many were skipped and why. If all selected installments already have receipts, the process stops here and offers to reprint instead.

Second, the application determines the count of new receipts to generate, which is the number of installments remaining after removing already-receipted ones.

Third, a Firestore Transaction runs. Inside the transaction, the settings document is read to get the current last_receipt_number value and the receipt_year value. The current calendar year is checked against the stored receipt_year. If they differ, the counter resets to zero and the receipt_year is updated to the current year. The counter is incremented by the count of new receipts. The updated last_receipt_number and receipt_year are written back to the settings document. All new receipt documents are written inside the same transaction. Each receipt document contains: a formatted receipt number string built as PREFIX + hyphen + YEAR + hyphen + SEQUENCE zero-padded to five digits, the installment ID, the customer ID, the contract ID, today's date as the issue date, the month and year as integers, and a printed field set to false. The transaction commits atomically. If the transaction fails due to a conflict, it is retried automatically by Firestore.

Fourth, after the transaction succeeds, each selected installment document is updated to store the ID of its newly created receipt in the receipt_id field.

Fifth, the user is navigated to a print preview page showing all newly generated receipts ready for printing.

**Step 6 — Print Preview Screen**

The print preview screen shows all the receipts just generated, laid out exactly as they will appear when printed. The screen has two buttons at the top: a Print button and a Back button. Everything else on the screen is the receipt layout.

Receipts are displayed three per row on desktop and one per row on mobile. Each receipt block is bordered with a dashed line and shows all the required fields: receipt number, issue date, customer full name, phone number, village, address, product name, installment amount in EGP with the word جنيه, the month and year in Arabic, the shop name from the settings document, the shop logo if the show-logo setting is enabled, and a signature line at the bottom.

The receipt block layout is RTL. Labels are on the right side and values are on the left side, which in RTL means labels are visually on the inner side close to the text start. The receipt number is displayed prominently at the top in a larger font than the body content. The amount is also displayed prominently, larger than the surrounding fields.

**Step 7 — Print Execution**

When the user taps the Print button, the application triggers the browser's native print dialog. The print layout is controlled entirely by CSS print media queries. When the browser enters print mode, the following changes apply: the application navigation shell (sidebar or bottom tabs) is hidden, the page header and filter controls are hidden, all buttons are hidden, and only the receipt blocks remain visible. Receipts are arranged so exactly three fit on each A4 page, with a dashed horizontal rule between each group of three. Each group of three receipts has a CSS page-break-after applied so the printer starts a new page after every three receipts.

All fonts in the print layout use point units. The receipt block uses a fixed layout that does not reflow with screen size. The shop logo is constrained to a maximum height of 60 points so it cannot overflow the receipt header. After the print dialog closes, the application remains on the print preview screen so the user can print again if needed.

**Step 8 — Reprint Flow**

Build the receipt lookup and reprint functionality, accessible from the Receipts section in the navigation. The Receipts screen has a search field where the user can search by receipt number or by customer name. The search returns a list of matching receipt records. Each result shows the receipt number, the customer name, the product name, the amount, and the month it was issued for.

Tapping a receipt result opens a single-receipt print preview showing that receipt exactly as it was originally generated. The same receipt number is shown — no new document is created, no counter is incremented. The user can tap Print to print just that one receipt using the same CSS print mechanism. The receipt block layout is identical to the batch print layout.

---

### Acceptance Criteria for Phase 3

Before moving to Phase 4, confirm all of the following. The collection screen filters by village and month and returns the correct installments. Late installments are visually distinct from pending ones. Marking an installment as paid updates Firestore and removes the card from the list. The confirmation dialog shows the correct customer name and amount. Marking as late changes the badge without removing the card. Selecting installments and tapping Generate Receipts runs the Firestore Transaction correctly. Two simultaneous receipt generations do not produce duplicate receipt numbers — test this by opening the app in two browser tabs and generating receipts from both at nearly the same time. Already-receipted installments are skipped correctly with an Arabic notice. The receipt numbers increment correctly and are formatted as PREFIX-YEAR-00001 with zero padding. The print preview shows all receipts with correct data. Three receipts fit on one A4 page when printed or saved as PDF. The print output hides all navigation and buttons. The reprint flow finds receipts by number and by customer name and prints with the original receipt number.

---

### Important Constraints

Do not build the reports screen in this phase. Do not build the settings screen in this phase. Do not add any features outside the collection, receipt generation, and print scope described above. The print system must use only browser-native print APIs and CSS — do not add any PDF generation library.

---
---

## PROMPT 4 OF 4 — Reports, Settings, Final Polish, and Production Deployment

You are completing the build of a web application for managing installment customers and monthly payment collection. Phases 1, 2, and 3 are complete. The application has authentication, navigation, customer management, contract creation, installment generation, collection screen, receipt generation, and printing — all working. Your job in this final phase is to build the reports screen, the settings screen, apply final UI polish across every screen, fix all known edge cases, and deploy the production-ready application to the live URL.

---

### Context Reminder

The application is in Arabic with RTL layout throughout. Currency is Egyptian Pounds (EGP). The target users are non-technical staff who will use the application daily on phones and on desktop computers. The interface must be clear, forgiving, and fast. Every screen must handle loading states, empty states, and error states explicitly — no blank white screens.

---

### What You Must Build in This Phase

**Step 1 — Reports Screen**

Replace the placeholder Reports page with a fully functional reports screen. The reports screen is read-only — it shows aggregated data from Firestore but does not allow any edits. The screen has a month and year selector at the top, identical in behavior to the one on the collection screen. When the user selects a month and year and triggers the report, the following four report sections are displayed.

The first section is Monthly Collection Summary. It shows three numbers: the total amount collected this month in EGP (sum of amounts for paid installments with payment date in the selected month), the number of installments paid this month (count of paid installments), and the number of installments still unpaid for the selected month (count of pending and late installments with due date in the selected month).

The second section is Village Breakdown. It shows a list of villages with the following data per village: village name, count of paid installments, count of unpaid installments, and total amount collected. Villages are sorted by total collected amount descending. This section only shows villages that have installments due in the selected month.

The third section is Late Customers. It shows a list of customers who have at least one installment with late status, regardless of the selected month. This is not filtered by month — it shows all currently late customers across all months. Each entry shows the customer name, phone number, village, and the count of their late installments.

The fourth section is an overall totals row showing the grand total collected across all months and the grand total of all outstanding (pending plus late) installments across all time.

All currency amounts are formatted as Arabic numerals followed by the word جنيه. All counts are whole numbers with no decimal places.

**Step 2 — Settings Screen**

Replace the placeholder Settings page with the fully functional settings screen. The settings screen allows the admin user to configure the application's shop identity and receipt configuration.

The screen is divided into two sections. The first section is Shop Identity. It contains a text field for the shop name, which appears on every printed receipt. It contains a logo upload control. When the user selects an image file from their device, the image is uploaded to Firebase Storage and the resulting URL is stored in the settings document's logo_url field. A preview of the current logo is shown below the upload control. A toggle switch labeled in Arabic controls whether the logo appears on printed receipts. The shop name and logo toggle are saved together when the user taps a save button.

The second section is Receipt Configuration. It shows the current receipt prefix in a read-only display field. It shows the current last receipt number in a read-only display field so the admin can see where the sequence stands. It shows the current receipt year. A reset button is available for the starting sequence number, intended for use at the beginning of a new year or for initial setup. This button is styled prominently as a danger action and requires a confirmation dialog before executing. The confirmation dialog in Arabic explains that resetting the sequence will cause all future receipts to start from 00001 and warns that this should only be done at the start of a new year.

**Step 3 — Loading States on All Screens**

Audit every screen in the application and ensure that each one explicitly handles the loading state when data is being fetched from Firestore. The loading state must not be a blank white screen or a spinning indicator alone. Each screen must show a skeleton layout — meaning gray placeholder shapes in the same positions where the real content will appear. The customer list skeleton shows several gray card-shaped rectangles. The collection screen skeleton shows the filter area and several gray installment card shapes below. The dashboard skeleton shows three gray card shapes. The reports skeleton shows the section headings with gray bars where numbers will appear.

Skeleton loaders must appear within 50 milliseconds of the screen mounting, so there is never a flash of blank white screen between navigation and content appearing.

**Step 4 — Empty States on All Screens**

Audit every screen and list that can be empty and ensure each one shows a meaningful Arabic empty state. An empty state must contain at minimum: a simple illustration or large icon appropriate to the context, a clear Arabic message explaining why the screen is empty, and where appropriate, a direct action button to create the first item.

The customer list empty state says there are no customers yet and offers a button to add the first customer. The customer detail page's contracts section empty state says this customer has no contracts yet and offers a button to create one. The collection screen results empty state, shown after the user searches and finds no results, says there are no unpaid installments for the selected village and month. The reports screen empty state, shown before the user selects a month, says to select a month above to view the report. The receipts screen empty state says no receipts have been generated yet.

**Step 5 — Error States and Retry Handling**

Every screen that makes a Firestore request must handle network errors and Firestore errors gracefully. When a request fails, the screen must not show a raw JavaScript error or a blank screen. It must show an Arabic message saying something went wrong, with a retry button that re-runs the failed request. The error message must be in a visually distinct container — a red or orange bordered box — so it is clearly distinguishable from normal content. Errors must be logged to the browser console in development mode with the full error details, even though the user sees only the friendly Arabic message.

**Step 6 — Mobile Usability Audit**

Open the application on an actual mobile phone (Android Chrome is the primary target) and walk through every user-facing flow. Fix any issues found in the following categories.

Touch targets: every tappable element must be at least 44px tall and 44px wide. Any button or link that is smaller than this must be enlarged. Inputs on small screens: form inputs must be large enough that the user does not need to zoom to read what they typed. The browser must not auto-zoom into inputs on focus, which happens if the input font size is smaller than 16px — ensure all inputs use at least 16px font size. Horizontal overflow: no screen may require horizontal scrolling. Any element that extends beyond the screen width must be made responsive. Print on mobile: open the print preview on a mobile browser and confirm that the Print button triggers the browser's share sheet or print dialog correctly. Navigation on mobile: the bottom tab bar must not overlap the main content area — the main content area must have sufficient bottom padding to account for the tab bar height.

**Step 7 — Quick Search on Dashboard**

Add a quick search bar to the dashboard screen. This is a prominent text input at the top of the dashboard, above the three summary cards. As the user types, it searches customer names and phone numbers in real time and shows matching customer cards below the input. Tapping a result navigates directly to that customer's detail page. This allows a staff member to find any customer from the home screen without navigating to the Customers section first. The search clears when the user navigates away from the dashboard and resets when they return.

**Step 8 — This Month Shortcut on Dashboard**

Add a shortcut button to the dashboard, placed below the three summary cards and above the quick search results. The button is labeled in Arabic with a phrase meaning View This Month's Collection. When tapped, it navigates directly to the Collection screen with the current month and current year pre-selected in the filters. This saves the user from having to navigate to Collection and manually set the filters to the current month — which is the most common action performed on the app each month.

**Step 9 — Final Firestore Composite Indexes**

Review all Firestore queries made anywhere in the application and confirm that every compound query has a corresponding composite index defined in the firestore.indexes.json file. The indexes file is the source of truth for Firestore indexes and is deployed automatically alongside the application. The critical indexes needed are: installments collection indexed on customer village plus due date plus status, installments collection indexed on contract ID plus due date, and receipts collection indexed on customer ID plus issue date. Confirm that the indexes are deployed and active in the Firebase Console before final testing.

**Step 10 — Production Deployment and Final Verification**

Perform the final production deployment. Before deploying, complete the following checklist in order. Verify that all environment variables in the production build configuration point to the production Firebase project, not the development project. Verify that Firestore security rules include no development-only overrides or commented-out restrictions. Verify that the build completes without any errors or warnings. Verify that the firestore.rules and firestore.indexes.json files are both included in the deployment. Deploy to the production Firebase Hosting URL. After deployment, perform a complete smoke test on the live production URL covering every major flow: login, add customer, add contract, view generated installments, use collection screen to search by village and month, mark one installment as paid, generate receipts for two installments, view print preview, print to PDF, reprint a receipt, view reports for the current month, update the shop name in settings, and logout.

Verify that the application works on Chrome on a desktop computer, Chrome on an Android phone, and Safari on an iPhone. If any issue is found during this verification, fix it and redeploy before marking Phase 4 complete.

---

### Acceptance Criteria for Phase 4

Before marking the project complete, confirm all of the following. The reports screen shows correct monthly totals, village breakdown, and late customers list. The settings screen saves shop name, logo, and logo toggle to Firestore correctly. Every screen shows a skeleton loader while data is fetching, never a blank white screen. Every list and screen has a meaningful Arabic empty state. Network errors show a retry button, not a blank screen or raw error. The mobile usability audit found no touch targets smaller than 44px, no horizontal overflow, and no zoom-on-focus issues. The quick search on the dashboard finds customers by name and phone. The This Month shortcut opens the collection screen with the correct month pre-selected. All Firestore composite indexes are deployed and active. The production deployment smoke test passed on Chrome desktop, Chrome Android, and Safari iPhone.

---

### Important Constraints

Do not add any features that are explicitly listed in the Out of Scope section of the PRD: no partial payments, no late fees, no SMS notifications, no multi-branch support, no Excel export, and no offline mode. If any of these requests come up during testing, they are deferred to v1.1. The goal of this phase is a complete, polished, production-ready version of exactly what was specified — nothing more and nothing less.

---

*End of AI Execution Prompts — All 4 Phases*
