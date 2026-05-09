# Technical Plan
## Installment & Collection Management Web Application

**Version:** 1.0  
**Based on:** PRD v1.0  
**Date:** May 2026  
**Estimated Build Time:** 6–8 weeks (solo developer) / 3–4 weeks (two developers)

---

## Table of Contents

1. Architecture Overview
2. Technology Stack — Decisions and Rationale
3. Project Structure and File Organization
4. Database Design and Firestore Strategy
5. Authentication and Security Plan
6. Frontend Architecture and Screen Flow
7. Core Logic: Installment Generation
8. Core Logic: Receipt Numbering System
9. Core Logic: Print and PDF System
10. State Management Strategy
11. Arabic / RTL Implementation Plan
12. Development Phases and Milestones
13. Testing Strategy
14. Deployment Plan
15. Risk Register and Mitigations

---

## 1. Architecture Overview

The system is a single-page web application with no traditional backend server. All data operations are handled directly between the browser and Firebase cloud services. This is sometimes called a "serverless" or "BaaS" (Backend as a Service) architecture, and it is the right choice for this system because the team is small, the data volume is moderate, and there is no need to manage or maintain a dedicated server.

The three main layers of the architecture are as follows.

The first layer is the **Frontend Application**, which runs entirely inside the user's browser. It handles all user interactions, form inputs, navigation, data display, and printing. It communicates directly with Firebase using Firebase's JavaScript SDK.

The second layer is **Firebase Firestore**, which is the cloud database. It stores all persistent data — customers, contracts, installments, receipts, and settings. It handles real-time data sync, meaning if two users are logged in simultaneously, they will see updates without needing to refresh the page.

The third layer is **Firebase Authentication**, which manages user login sessions. It provides secure, token-based authentication and handles session persistence across browser refreshes and device switches.

There is no custom API server, no Node.js backend, and no REST endpoints to manage. This simplifies the entire project significantly and removes a major category of infrastructure risk.

The overall data flow for any action in the system works like this: the user interacts with the UI, the frontend reads or writes data directly to Firestore using the SDK, Firestore returns results or confirms the write, and the UI updates accordingly. For sensitive operations like receipt numbering, Firestore Transactions are used to ensure atomicity, which means no two receipts can accidentally get the same number even if two users click at the exact same moment.

---

## 2. Technology Stack — Decisions and Rationale

Every technology choice in this plan was made to minimize complexity, reduce the chance of bugs, and allow fast development without sacrificing reliability.

### Frontend Framework: React

React is chosen as the frontend framework. It is the most widely supported JavaScript UI library in the world, with extensive documentation and a large community. React makes it straightforward to build component-based UIs — meaning each part of the screen (a customer card, a receipt block, a filter bar) is a self-contained piece that can be developed and tested independently.

React also has excellent support for RTL (right-to-left) layouts, which is essential for this Arabic-language application. Libraries for routing, state management, and printing all have first-class React support.

The alternative of plain HTML and JavaScript was considered, but rejected because as the application grows in complexity — particularly around the receipt generation flow, collection screen filtering, and print layout — managing state and DOM updates manually becomes increasingly error-prone and slow to develop.

### Styling: Tailwind CSS

Tailwind CSS is a utility-first styling framework that allows developers to apply styles directly in the HTML structure without writing custom CSS files. It is chosen for this project because it makes building large, readable text, big buttons, and clean card layouts very fast. It also has built-in support for RTL direction using the `dir="rtl"` HTML attribute, which all Tailwind utility classes respect automatically.

Tailwind's purging system ensures that the final CSS file sent to the browser only includes the styles actually used in the app, keeping load times fast.

### Cloud Database: Firebase Firestore

Firestore is a NoSQL document database hosted by Google. It was chosen because it requires zero server setup, scales automatically, has a generous free tier that is more than sufficient for this application's data volume, and provides a real-time listener capability that keeps all connected browsers in sync without polling.

The NoSQL document model suits this data perfectly. Each customer, contract, installment, and receipt is a self-describing document, and querying by village or by month is natively supported through Firestore's indexed compound queries.

The main alternative considered was Supabase (PostgreSQL). Supabase is an excellent choice for teams that prefer SQL and relational data. However, for this project, Firestore was chosen because it has a simpler operational model, handles offline caching gracefully (useful in areas with spotty internet), and its real-time capabilities are more mature and stable for small-team applications.

### Authentication: Firebase Authentication

Firebase Auth handles all login and session management. It integrates directly with Firestore security rules, meaning only authenticated users can read or write data. It supports email and password login out of the box, persists sessions across browser tabs and restarts, and handles token refresh automatically without any developer intervention.

### Hosting: Firebase Hosting

Firebase Hosting serves the built React application as a static site from Google's global CDN. Deployment is a single command. HTTPS is automatically configured and renewed. Custom domains are supported. The free Spark plan covers the traffic volume expected by this application with no monthly cost.

### Print and PDF: Browser Print API with CSS

Rather than using an external PDF generation library (which would add complexity, cost, and potential failure points), the print system uses the browser's built-in print functionality enhanced with CSS print media queries. When the user triggers a print, the application renders a special print-only view with 3 receipts per A4 page, hides all navigation and UI chrome, and invokes the browser's native print dialog, which allows saving to PDF on all modern operating systems.

This approach works on Chrome, Firefox, Safari, and Edge. It requires no server, no file generation, and no third-party service. The result is a clean, predictable PDF that matches exactly what the user sees in the print preview.

---

## 3. Project Structure and File Organization

The project will be organized in a way that maps directly to the features of the application. Any developer reading the folder names should be able to immediately understand where to find any piece of functionality.

The top-level source folder contains the following major sub-directories.

The **pages** folder contains one file per major screen of the application: Dashboard, Customers, Customer Detail, Add Customer, Contracts, Add Contract, Collection, Receipts, Print, Reports, Settings, and Login. Each page file is responsible only for the top-level layout and data fetching for that screen.

The **components** folder contains reusable UI pieces used across multiple pages. Examples include the Customer Card component used on both the Customer List and the Collection screen, the Status Badge component used on installments and contracts, the Confirmation Dialog component used before destructive actions, the Receipt Block component used in both the preview and the print view, and the Page Header component with navigation.

The **hooks** folder contains custom React hooks that encapsulate data-fetching and business logic. Examples include a hook for fetching customers filtered by village, a hook for fetching installments by month and village, and a hook for generating the next receipt number safely. Separating logic into hooks keeps the page files clean and focused on display.

The **services** folder contains all direct Firestore interactions. Every read, write, and transaction operation is defined here as a named function. Pages and hooks call these service functions rather than writing Firestore queries inline. This makes the Firestore-specific logic easy to find, test, and change if needed.

The **utils** folder contains pure helper functions with no side effects. This includes the date formatting utility (converting Gregorian dates to Arabic month names), the currency formatting utility (formatting numbers as Egyptian Pounds), the receipt number formatting utility, and the installment generation algorithm.

The **print** folder contains the print-specific React components and CSS. These components are invisible during normal app usage and only appear when the print dialog is triggered. They define the exact A4 layout with 3 receipts per page.

The **firebase** folder contains the Firebase configuration and initialization. All other files import from this single location, making it easy to change Firebase projects (for example, switching from a development project to a production project) with a single change.

---

## 4. Database Design and Firestore Strategy

Firestore organizes data as Collections (like tables) containing Documents (like rows). Each document has a unique ID and contains fields. Documents can also contain sub-collections, but for this application we keep all data at the top level with references between collections, which is simpler to query and maintain.

### Collections

The application uses five top-level collections: **customers**, **contracts**, **installments**, **receipts**, and **settings**.

The **customers** collection is the anchor of the entire data model. Every contract, installment, and receipt traces back to a customer. The village field on the customer document is the primary filter used in the collection screen. All customer documents are soft-deleted by setting an `isDeleted` boolean field to true, rather than physically removing the document. This preserves the integrity of all linked contracts, installments, and receipts.

The **contracts** collection stores each installment agreement. The `customer_id` field holds the string ID of the customer document it belongs to. When a contract is saved, a batch write operation simultaneously creates the contract document and all of its installment documents in a single atomic operation. This ensures there can never be a contract without its corresponding installments.

The **installments** collection stores every individual monthly payment record. Each installment holds the ID of its parent contract and the ID of its parent customer (denormalized for query efficiency, so we do not need to look up the contract every time we want to show the customer name on the collection screen). The `due_date` field stores the first day of the month the installment is due, formatted as a Firestore Timestamp. This allows efficient range queries when filtering by month and year.

The **receipts** collection stores the permanent record of every generated receipt. Once written, a receipt document is never updated or deleted. The `receipt_number` field stores the full formatted string (e.g., `RCPT-2026-00042`) and is indexed for fast lookup. The `installment_id` field links to the installment it covers, and this field is also indexed to allow fast duplicate-prevention checks before generating a new receipt.

The **settings** collection contains exactly one document with a fixed, known ID. This document stores the shop name, logo URL, receipt prefix, and the `last_receipt_number` counter. Using a single known document makes reads and writes to settings trivially simple.

### Key Firestore Query Patterns

The collection screen is the most query-intensive screen in the application. It must return all installments for a given village and a given month. Because Firestore requires that any fields used together in a compound query must have a composite index defined, we plan these indexes during project setup, not after deployment. The required composite index is: `village` (ascending) + `due_date` (ascending) + `status` (ascending). Firestore's console generates this index automatically the first time the query is run in development, and we export it to the project configuration file so it deploys automatically.

### Firestore Transactions for Receipt Numbering

The most sensitive operation in the entire system is generating a new receipt number. If two users generate receipts simultaneously, both could read `last_receipt_number` as 41, both increment to 42, and two receipts get the same number — which is a serious accounting error.

This is prevented by using a Firestore Transaction for every receipt generation operation. A transaction works as follows: it reads the current `last_receipt_number`, increments it, writes the new value back to the settings document, and writes the new receipt documents — all in a single atomic unit. If any part of the operation fails (including a simultaneous conflicting write from another user), the entire transaction is automatically retried. This guarantees that receipt numbers are always unique, always sequential, and never lost or duplicated.

---

## 5. Authentication and Security Plan

### Firebase Authentication Setup

Authentication uses Firebase's email and password provider. There is no self-registration flow in the application. The admin creates new user accounts directly in the Firebase Console. Users log in on the login screen, and their session is persisted in the browser's local storage by Firebase automatically, so they do not need to log in again on every visit.

A persistent logout button is available in the application's navigation menu. The application checks for an active session on startup and redirects to the login page if no session exists.

### Firestore Security Rules

Firestore security rules are the server-side enforcement of access control. They are written in Firestore's rule language and deployed alongside the application. No matter what the frontend application does, the security rules are the final authority on what reads and writes are allowed.

The rules for this application are structured as follows. All collections are completely blocked by default. Access is granted only to requests that include a valid Firebase Authentication token, meaning the user is logged in. There are no public read endpoints. There are no anonymous access paths.

The rules further restrict write access: only authenticated users can create or update documents. Delete operations are completely blocked for receipts and installments through the security rules, providing a server-side guarantee of the business rule that these records cannot be deleted, even if the frontend code were somehow bypassed.

The settings document allows reads by any authenticated user and writes only by users with an admin custom claim. The admin claim is set manually in the Firebase Console for the primary admin user.

### Data Validation

Beyond access control, Firestore security rules also enforce basic data shape validation. For example, a write to the installments collection is rejected if the `status` field is not one of the three allowed values. A write to the receipts collection is rejected if the `receipt_number` field is missing or empty. This is a second line of defense beyond the frontend validation.

---

## 6. Frontend Architecture and Screen Flow

### Routing

The application uses React Router for navigation. Each major screen has its own URL path. This makes browser navigation (back button, bookmarks) work correctly and allows deep linking — for example, sharing a direct link to a specific customer's page.

The router is wrapped in an authentication guard: any navigation attempt to a protected route by an unauthenticated user is automatically redirected to the login page.

### Screen List and Navigation Hierarchy

The navigation structure is intentionally flat. There are only two levels: the main navigation (always visible at the bottom of the screen on mobile, or in a sidebar on desktop) and the detail pages that open from lists.

The main navigation contains five items: Home (Dashboard), Customers, Collection, Reports, and Settings. These five items cover every action a user needs to take. The receipt generation and printing flow is accessed through the Collection screen rather than having its own navigation item, keeping the menu minimal.

From the Customers list, users navigate to a Customer Detail page. From Customer Detail, they navigate to individual Contract pages. From any Contract page, they can view the installment list. These form a natural drill-down path that mirrors how the user thinks about the data.

### Component Design Philosophy

Every UI component in the application follows three rules. First, it should do one thing. A component that shows a customer name, phone, and village should not also handle the logic for deleting the customer — that logic belongs in the page. Second, it should look identical wherever it appears. The Customer Card on the Customers list should look exactly the same as the Customer Card shown in the Collection screen. Third, it should fail gracefully. If data is loading, it shows a skeleton loader. If data is empty, it shows a clear Arabic message explaining there is nothing here yet and offering a direct button to add the first item.

### Loading and Error States

Every screen that fetches data from Firestore must handle three states explicitly: loading (showing a spinner or skeleton layout), success (showing the data), and error (showing a user-friendly Arabic message with a retry button). This is not optional — a screen that shows a blank white page while loading is confusing and feels broken, especially on slower mobile connections.

---

## 7. Core Logic: Installment Generation

When a user saves a new contract, the system must automatically generate a set of monthly installment records. This is one of the two most important business logic operations in the entire application.

The generation algorithm works through the following steps.

First, the system reads the contract's three key fields: the `start_date`, the `months_count`, and the `monthly_amount`.

Second, it enters a loop that runs exactly `months_count` times. On each iteration, it calculates the `due_date` for that installment. The due date is always set to the first day of the month. For the first installment, the due date is the first day of the same month as the `start_date`. For each subsequent installment, the month is incremented by one. The system handles year boundaries correctly — if the start month is November 2026 and there are 6 installments, the due dates will correctly roll over into 2027.

Third, each installment document is assembled with the following fields set automatically: the `contract_id`, the `customer_id` (copied from the contract for query efficiency), the `due_date` as a Firestore Timestamp, the `amount` set to `monthly_amount`, the `status` set to `pending`, and `payment_date` and `receipt_id` set to null.

Fourth, all installment documents plus the contract document are written to Firestore in a single batch write operation. A batch write either succeeds completely or fails completely — there is no state where a contract exists without all its installments, or where some installments are created and others are not.

Fifth, after the batch write confirms success, the application navigates the user directly to the new contract's detail page, where they can see all the generated installments in a list.

One edge case to handle carefully: the last installment of a contract. Sometimes the total amount divided by the monthly amount does not divide evenly. For example, a contract for 1050 EGP with monthly payments of 200 EGP over 5 months gives 1000 EGP, not 1050 EGP. The system handles this by setting the last installment's amount to the remainder (50 EGP in this case) rather than the standard monthly amount. The PRD specifies that the user enters both total amount and monthly amount separately, so the system can detect this mismatch and handle it cleanly.

---

## 8. Core Logic: Receipt Numbering System

The receipt numbering system is the most critical piece of logic in the application from an accounting and legal standpoint. Receipts must be numbered sequentially, with no gaps and no duplicates.

The numbering format is `PREFIX-YEAR-SEQUENCE`, for example `RCPT-2026-00042`. The PREFIX and YEAR come from the settings document. The SEQUENCE is a zero-padded 5-digit number derived from the `last_receipt_number` counter in the settings document.

The generation flow proceeds through the following steps.

Step one: the user selects one or more installments on the collection screen and taps "Generate Receipts." Before doing anything else, the system checks each selected installment to confirm it does not already have a linked receipt. Any installments that already have a receipt are filtered out of the selection silently, showing the user a notice of how many were skipped.

Step two: the system calculates how many new receipts need to be created. If three installments are selected and all are new, three receipts will be created.

Step three: the system opens a Firestore Transaction. Inside the transaction, it reads the `last_receipt_number` from the settings document. It then increments this number by the count of new receipts. It writes the updated `last_receipt_number` back to the settings document. It then constructs each receipt document with its sequential number and writes all receipt documents. The transaction commits atomically.

Step four: the system updates each installment document to store the ID of its new receipt in the `receipt_id` field. It also updates the installment's `status` from `pending` to a state that indicates a receipt has been issued (this is distinct from `paid` — the receipt is issued before collection happens in the field).

Step five: after all writes confirm, the system navigates to a print preview page showing all newly generated receipts ready for printing.

The annual reset logic: on January 1st of each year, the `last_receipt_number` in the settings resets to zero. This is handled by storing the `receipt_year` alongside the counter. When a receipt generation is triggered, the system checks whether the current year matches the stored `receipt_year`. If they differ, it resets the counter to zero and updates the year before proceeding. This check happens inside the same transaction that generates the receipts, so the year boundary is handled atomically.

---

## 9. Core Logic: Print and PDF System

The print system must produce a clean A4 page with exactly 3 receipts per page, separated by dashed lines, showing all required fields in Arabic, with the shop logo if enabled.

### Print Flow

When the user taps "Print," the application renders a full-screen print-only view. This view contains all the selected receipts arranged in groups of three per page. All application navigation, headers, filters, and buttons are hidden using CSS display rules that activate only when the browser's print mode is active.

The user is then shown a print preview using the browser's native print dialog. From this dialog they can print to a physical printer or save as a PDF. The system requires no server involvement at any point.

### Receipt Block Layout

Each receipt block occupies exactly one-third of an A4 page. The block contains three visual zones. The header zone shows the shop name, logo (if enabled), and receipt number. The body zone shows all customer and contract information in a two-column layout: labels on the right and values on the left (since the layout is RTL). The footer zone shows the installment amount prominently, the month and year, and a signature line.

Each receipt block is surrounded by a dashed border. Between receipts there is a dashed horizontal dividing line with a scissors icon, indicating where to cut the page into three separate receipts for distribution to customers.

### Reprint Flow

When a user needs to reprint a receipt that was previously generated, they navigate to the Receipts section and search by receipt number or customer name. The system fetches the existing receipt document and all associated data (customer, contract, installment) and renders the receipt block identically to the original. The same receipt number is displayed. No new document is created in Firestore. The print flow is identical to the original print flow.

### Print Quality Considerations

All font sizes in the print layout use point units rather than pixel units, which are the standard for print output. The layout uses a fixed-width column structure that does not reflow based on screen size. Arabic text is explicitly set to RTL direction. All numbers (amounts, dates, phone numbers) are formatted consistently. The shop logo, if provided, is constrained to a maximum height to prevent it from distorting the receipt layout.

---

## 10. State Management Strategy

For an application of this size and complexity, a dedicated global state management library (such as Redux) is unnecessary and would add significant boilerplate. Instead, the application uses a combination of two simpler approaches.

The first approach is **React Query** (also known as TanStack Query) for all server state — meaning data that comes from Firestore. React Query handles fetching, caching, background refresh, and loading/error states automatically. When a user marks an installment as paid, React Query automatically refetches the collection screen data, so the UI updates without requiring a manual page refresh. This eliminates an entire category of stale-data bugs.

The second approach is **React's built-in useState and useContext** for local UI state — meaning things like which filters are currently selected on the collection screen, whether a confirmation dialog is open, or what text is in a search field. These pieces of state are local to the screen they belong to and do not need to be shared globally.

The one piece of truly global state is the authentication status (is the user logged in, and who are they). This is managed through a React Context that wraps the entire application and is populated by Firebase Auth's session listener.

This combination of React Query for server state and React Context for authentication gives the application a clean and predictable data flow without requiring developers to understand a complex state management system.

---

## 11. Arabic / RTL Implementation Plan

Building an Arabic RTL application requires explicit attention at every layer of the stack. The following steps ensure the Arabic layout is correct and consistent throughout.

The HTML root element has `dir="rtl"` and `lang="ar"` set. This tells the browser, Tailwind, and all child components to render in RTL mode. All directional properties — padding, margin, text alignment, flex direction, icon placement — follow RTL conventions automatically when this attribute is set.

The primary font for all Arabic text is **Cairo**, a Google Font that is clean, highly legible at large sizes, and designed for both Arabic and Latin characters. Cairo is loaded from Google Fonts with a font-display of swap, meaning the page renders immediately with a fallback font while Cairo loads, preventing invisible text.

All date displays use Arabic month names rather than numbers where space permits. A utility function maps month numbers to their Arabic names (يناير، فبراير، مارس, etc.). On the receipt print layout, the month is always shown as the Arabic name followed by the year.

Currency amounts are always formatted as a number followed by the word "جنيه" (pound). There is no EGP prefix or symbol, which would feel unnatural in an Arabic UI.

Input fields for numbers (amounts, phone numbers) use the standard Western numerals (0–9) rather than Eastern Arabic numerals (٠–٩), because data entry with standard numerals is faster on both phone and computer keyboards, and the fields are numeric type which triggers the numeric keyboard on mobile devices.

Form validation error messages are all written in Arabic. Required field messages, format error messages, and business rule violation messages (such as attempting to create a receipt for an installment that already has one) all display in clear, polite Arabic.

---

## 12. Development Phases and Milestones

The project is divided into five phases. Each phase produces working, testable software that builds on the previous phase.

### Phase 1: Foundation (Week 1)

The goal of Phase 1 is to have a working application shell with authentication, Firebase connected, and the basic project structure in place. By the end of this phase, a developer can log in, see the empty dashboard, and navigate between the main sections.

The steps in Phase 1 are: create the Firebase project in the Firebase Console, enable Firestore and Authentication, configure email/password sign-in, create the first admin user account, scaffold the React project with Tailwind CSS configured for RTL, set up React Router with all route paths defined, create the login page with email/password form connected to Firebase Auth, create the authentication guard that redirects unauthenticated users, build the main navigation layout (bottom tabs for mobile, sidebar for desktop), create empty placeholder pages for each main section, deploy the initial build to Firebase Hosting, and confirm that the login and navigation work correctly on both a desktop browser and a mobile phone.

### Phase 2: Customer and Contract Management (Weeks 2–3)

The goal of Phase 2 is to allow full management of customers and contracts, including the automatic generation of installments.

The steps in Phase 2 are: build the Customers list page with search and village filter, build the Add Customer form with validation, build the Customer Detail page showing customer info and linked contracts, build the Add Contract form with all fields, implement the installment generation algorithm in the utils layer, implement the batch write operation that saves contract and all installments atomically, build the Contract Detail page showing the installment list with status badges, implement the edit customer functionality, implement soft-delete for customers with the active-contract guard, write the Firestore composite indexes needed for village and date queries, and write the Firestore security rules for the customers, contracts, and installments collections.

### Phase 3: Collection Screen and Receipt Generation (Weeks 3–4)

The goal of Phase 3 is to implement the core operational workflow: filtering installments by village and month, generating receipts with sequential numbering, and updating installment statuses.

The steps in Phase 3 are: build the Collection screen with village dropdown and month/year selector, implement the Firestore query for installments by village and month, build the installment list with status badges and action buttons, implement the "Mark as Paid" action with payment date recording, implement the "Mark as Late" action, build the receipt selection UI with select-all toggle, implement the Firestore Transaction for atomic receipt number generation, build the receipt generation confirmation dialog, implement the duplicate-receipt guard that checks for existing receipts before generating, write all receipt documents after a successful transaction, update linked installment documents with receipt IDs, and navigate to the print preview after successful generation.

### Phase 4: Print System and Reports (Weeks 4–5)

The goal of Phase 4 is to deliver the print and PDF functionality and the basic reports.

The steps in Phase 4 are: build the Receipt Block component with full RTL layout, build the Print Preview page with 3 receipts per A4 page using CSS print media queries, test the print layout in Chrome, Firefox, and Safari on both Mac and Windows, verify the PDF export output on all tested browsers, implement the receipt search and reprint flow, build the Reports page with monthly totals, unpaid count, late customers list, and village totals, and build the Settings page with shop name, logo upload, and receipt configuration.

### Phase 5: Polish, Testing, and Launch (Weeks 5–6)

The goal of Phase 5 is to refine the user experience, fix edge cases, and deploy the final production build.

The steps in Phase 5 are: conduct a full user acceptance test of every workflow with a real user (preferably the person who will use the system daily), fix all bugs and usability issues found during testing, add the quick search bar to the dashboard, add the "This Month" shortcut button to the dashboard, finalize all Arabic text and validation messages, add loading skeleton screens to all data-fetching pages, test the complete application on a budget Android phone to confirm mobile usability, review and finalize all Firestore security rules, remove all development console logs, configure Firebase Hosting to serve the app with proper cache headers, run a final deployment and smoke-test all features on the live URL, and hand over the admin credentials and basic user guide.

---

## 13. Testing Strategy

Given the team size and timeline, the testing strategy focuses on the highest-risk areas rather than aiming for complete automated test coverage.

### Unit Testing

The pure utility functions in the utils folder — specifically the installment generation algorithm, the receipt number formatting function, and the date/currency formatting utilities — are covered by unit tests. These functions are completely stateless and easy to test with a range of inputs. Testing the installment generator covers edge cases like a single-month contract, a 24-month contract, contracts that start in October or November (where year rollover must happen), and contracts where the total amount does not divide evenly by the monthly amount.

### Integration Testing

The two Firestore Transaction operations — receipt number generation and contract/installment batch write — are tested against a local Firestore emulator. The Firebase Emulator Suite provides a complete local simulation of Firestore that runs on the developer's machine, allowing these critical operations to be tested without touching the production database.

### Manual Testing Checklist

Before each phase is marked complete, the developer runs through a manual testing checklist that covers every screen and every user action in that phase. The checklist is written as a document in the project repository and updated as new features are added. By the end of Phase 5, the checklist covers the entire application.

### Device Testing

The application is tested on at minimum: a MacBook or Windows laptop using Chrome, an iPhone using Safari, and a mid-range Android phone using Chrome. The Android phone test is the most important, as it represents the most constrained environment and the most likely device for field use.

---

## 14. Deployment Plan

### Environments

The project uses two environments: **development** and **production**. Each environment has its own Firebase project, its own Firestore database, and its own hosting URL. Development data never touches the production database, and production data is never used for testing.

The developer works against the development Firebase project locally. When a phase is complete and tested, the build is deployed to the development hosting URL for user review. Only after the user approves the build on the development URL is it deployed to the production URL.

### Deployment Steps

The deployment process uses the Firebase CLI tool. A deployment consists of two parts: pushing the Firestore security rules and indexes (which update the database configuration) and pushing the built React application (which updates the hosted web files). Both happen in a single command.

Before each production deployment, the developer manually verifies: that all environment variables point to the production Firebase project, that the security rules include no development-only overrides, and that the build completes without warnings.

### Custom Domain

The production URL is configured to use a custom domain provided by the owner. Firebase Hosting handles SSL certificate provisioning and renewal automatically for custom domains. DNS configuration instructions are provided to the domain registrar.

### Backup Strategy

Firestore has built-in point-in-time recovery for the Blaze (paid) plan, which allows restoring the database to any state within the past 7 days. For the initial launch, the application operates on the free Spark plan, which does not include automated backups. A weekly manual export of the Firestore data to a JSON file is scheduled as a task. This export is stored in a Google Drive folder. If the application grows to justify the Blaze plan upgrade, automated daily backups will be enabled.

---

## 15. Risk Register and Mitigations

### Risk 1: Receipt Number Duplication

**Likelihood:** Low. **Impact:** Critical.

If two users generate receipts at exactly the same moment and the transaction fails to prevent a conflict, two receipts could receive the same number, which is an accounting violation.

**Mitigation:** Firestore Transactions provide atomic read-increment-write operations that are guaranteed to prevent this. The transaction is retried automatically on conflict. This risk is effectively eliminated by the architecture choice. As an additional safeguard, the receipt number field is indexed and checked for uniqueness before writing.

### Risk 2: Data Loss on Poor Internet Connection

**Likelihood:** Medium. **Impact:** High.

If a user is entering data on a poor mobile connection and their write to Firestore fails, they could lose the data they entered.

**Mitigation:** Firestore's SDK includes an offline persistence layer that caches writes locally and syncs them when connectivity is restored. This is enabled by default on mobile browsers and can be explicitly enabled for the web application. For critical operations like generating receipts, the UI shows the user a clear confirmation that the operation succeeded before navigating away.

### Risk 3: Print Layout Varies Across Browsers

**Likelihood:** Medium. **Impact:** Medium.

Different browsers implement CSS print media queries slightly differently, particularly around page margins and font rendering.

**Mitigation:** The print layout is tested on Chrome (primary target), Firefox, and Safari before launch. Chrome is recommended to users as the primary browser for printing, as it provides the most reliable and featureful print-to-PDF experience. Browser-specific CSS overrides are written for known issues.

### Risk 4: Logo Image Distorts Receipt Layout

**Likelihood:** Low. **Impact:** Low.

If a user uploads an unusually large or oddly-proportioned logo image, it could overflow the receipt header and push other fields off the page.

**Mitigation:** The logo image on the receipt is constrained to a maximum width and maximum height using CSS. Any image provided will be scaled down to fit within these constraints while maintaining its aspect ratio. The uploaded image is also validated for file type and size during the upload process.

### Risk 5: Accidental Data Deletion

**Likelihood:** Low. **Impact:** High.

A user could accidentally delete a customer or contract, causing confusion.

**Mitigation:** All delete operations show a confirmation dialog that requires the user to explicitly confirm. Customer deletion is blocked entirely if the customer has any contracts. Installments and receipts cannot be deleted through the UI at all, as the delete buttons are not present. Firestore security rules block delete operations on installments and receipts at the server level, providing a backstop even if the frontend code were somehow bypassed.

### Risk 6: Firebase Free Tier Limits

**Likelihood:** Low. **Impact:** Medium.

The Firebase Spark free tier has limits on the number of Firestore reads and writes per day. For normal usage of this application (a few hundred installments per month), these limits are far from being reached. However, if the business grows significantly or the application is used by many simultaneous users, the limits could be approached.

**Mitigation:** Firebase's console provides real-time usage monitoring with alerts. The application is designed to be efficient with reads — list screens fetch only the fields needed for display rather than entire documents, and React Query caches responses to avoid redundant fetches. If limits are approached, upgrading to the Blaze pay-as-you-go plan costs only what is actually used and can be done without any code changes.

---

*End of Technical Plan v1.0*
