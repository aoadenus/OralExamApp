import baseData from './sql-requirements.json';
import type { SqlRequirement } from '../types';

type RequirementMeta = Pick<
  SqlRequirement,
  | 'expectedResultDescription'
  | 'expectedResultShape'
  | 'easyQuestion'
  | 'hardQuestion'
  | 'easyChecklist'
  | 'hardChecklist'
  | 'knownRiskNotes'
  | 'status'
  | 'clauseBreakdown'
>;

const requirementMeta: Record<string, RequirementMeta> = {
  'sql-01': {
    expectedResultDescription: 'Return customer names, contact details, and purchase counts for repeat customers who are not enrolled in loyalty.',
    expectedResultShape: [
      'Expected columns: CustomerID, customer_name, Email, Phone, total_purchases.',
      'One row per non-loyalty customer whose completed or delivered order count is greater than five.',
    ],
    easyQuestion: 'What does HAVING do?',
    hardQuestion: 'Why use HAVING COUNT(o.OrderID) > 5 instead of WHERE COUNT(o.OrderID) > 5 here?',
    easyChecklist: [
      'Defines HAVING as filtering grouped results after aggregation.',
      'Uses SQL vocabulary like aggregate, grouped rows, or post-group filter.',
      'Distinguishes HAVING from WHERE by saying WHERE runs before grouping.',
      'Ties HAVING to COUNT(o.OrderID) > 5 in this script.',
      'Answers directly instead of describing the whole query.',
    ],
    hardChecklist: [
      'States that the query targets repeat customers not already in the loyalty program.',
      'Explains that Customer, Order, and LoyaltyProgram are all needed for identity, purchase count, and exclusion logic.',
      'Explains that HAVING is required because COUNT only exists after GROUP BY.',
      'Explains that WHERE COUNT(...) would be invalid or would fail before aggregation.',
      'Interprets the result as a bakery outreach list for loyalty signup targeting.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL string concatenation with ||; MySQL would need CONCAT or another equivalent.',
      'Uses a quoted "Order" table name, which is draft-safe for study but may need dialect-specific handling.',
      'Study-useful even if the final team schema or dialect changes later.',
    ],
    status: 'draft',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the customer identifiers, contact info, and the purchase count the bakery would use for outreach.' },
      { clause: 'FROM', why: 'Starts from Customer because the final report is one row per customer.' },
      { clause: 'JOIN', why: 'Joins Order so the script can count purchases for each customer.' },
      { clause: 'WHERE', why: 'Keeps only fulfilled orders and excludes any customer already found in LoyaltyProgram.' },
      { clause: 'GROUP BY', why: 'Groups rows by customer so COUNT(o.OrderID) becomes a per-customer purchase total.' },
      { clause: 'HAVING', why: 'Filters those grouped customer totals down to only customers with more than five purchases.' },
      { clause: 'ORDER BY', why: 'Sorts the highest purchase counts first so the most valuable non-members appear first.' },
    ],
  },
  'sql-02': {
    expectedResultDescription: 'Return ingredient name, current stock, minimum stock, unit, and shortage amount for low-stock ingredients.',
    expectedResultShape: [
      'Expected columns: IngredientName, current_stock, minimum_stock, unit, shortage.',
      'One row per ingredient where CurrentStock is below ReorderThreshold.',
    ],
    easyQuestion: 'What does the WHERE clause do here?',
    hardQuestion: 'Why compare CurrentStock and ReorderThreshold in the same row instead of filtering against one fixed number?',
    easyChecklist: [
      'Defines WHERE as row-level filtering before grouping.',
      'Uses SQL vocabulary like filter, condition, or predicate.',
      'Distinguishes WHERE from HAVING by saying HAVING is for grouped results.',
      'Ties WHERE to CurrentStock < ReorderThreshold in this script.',
      'Answers directly in one focused explanation.',
    ],
    hardChecklist: [
      'States that the query is trying to find ingredients that need restocking now.',
      'Explains that Inventory holds stock values while Ingredient supplies readable names and units.',
      'Explains that each ingredient can have a different threshold, so a column-to-column comparison is needed.',
      'Explains that one fixed number would hide item-specific reorder rules.',
      'Interprets the result as a restock priority list for bakery operations.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL ::numeric casting before ROUND, which would need adjustment in MySQL.',
      'Still a strong oral-practice script because the business logic is clear even if dialect cleanup is needed.',
    ],
    status: 'risky',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the ingredient label, both stock values, and the calculated shortage amount.' },
      { clause: 'FROM', why: 'Starts from Inventory because the shortage logic depends on stock and threshold values stored there.' },
      { clause: 'JOIN', why: 'Joins Ingredient so the bakery can see human-readable ingredient names and units.' },
      { clause: 'WHERE', why: 'Keeps only rows where current stock is already below the reorder threshold.' },
      { clause: 'ORDER BY', why: 'Puts the biggest shortages first so the most urgent ingredients are reviewed first.' },
    ],
  },
  'sql-03': {
    expectedResultDescription: 'Return employee ID, employee name, role, and order count for the top employees last month.',
    expectedResultShape: [
      'Expected columns: EmployeeID, employee_name, RoleName, order_count.',
      'One row per employee from last month, ranked by the number of assigned orders.',
    ],
    easyQuestion: 'What does ORDER BY order_count DESC do?',
    hardQuestion: 'Why is OrderAssignment necessary instead of joining directly from Order to Employee?',
    easyChecklist: [
      'Defines ORDER BY DESC as sorting highest values first.',
      'Uses terms like descending, rank, or sorted output.',
      'Distinguishes ORDER BY from GROUP BY by saying ORDER BY sorts while GROUP BY creates groups.',
      'Ties the sort to order_count in this script.',
      'Answers directly instead of retelling every clause.',
    ],
    hardChecklist: [
      'States that the query is trying to find which employee processed the most orders last month.',
      'Explains that OrderAssignment, Employee, Role, and Order each contribute assignment links, names, roles, and dates.',
      'Explains that OrderAssignment is the bridge that records which employee handled which order.',
      'Explains that skipping OrderAssignment would lose the employee-to-order relationship or assume a design not present here.',
      'Interprets the result as a top-performer report for bakery staffing or review.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL DATE_TRUNC and INTERVAL syntax that will need MySQL conversion later.',
      'Task wording says "the employee" but the current script returns the top five rows; useful for oral logic but still drafty.',
      'Quoted "Order" may need dialect-specific handling.',
    ],
    status: 'risky',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the employee identity, role, and order count needed for ranking.' },
      { clause: 'FROM', why: 'Starts from OrderAssignment because that table captures who processed each order.' },
      { clause: 'JOIN', why: 'Joins Employee for names, Role for titles, and Order for the date filter.' },
      { clause: 'WHERE', why: 'Limits the count to orders placed during the previous month only.' },
      { clause: 'GROUP BY', why: 'Creates one group per employee and role so COUNT(oa.OrderID) becomes a per-employee total.' },
      { clause: 'ORDER BY', why: 'Ranks employees by highest order_count first.' },
      { clause: 'LIMIT', why: 'Keeps only the top slice of the ranking for quick oral explanation.' },
    ],
  },
  'sql-04': {
    expectedResultDescription: 'Return supplier name, contact name, invoice count, and total expense for each supplier in the chosen quarter window.',
    expectedResultShape: [
      'Expected columns: SupplierName, ContactName, invoice_count, total_expense.',
      'One row per supplier with invoice volume and total spend in the filtered quarter.',
    ],
    easyQuestion: 'What does SUM(inv.TotalAmount) do?',
    hardQuestion: 'Why group by supplier instead of returning one grand total?',
    easyChecklist: [
      'Defines SUM as adding values within each group.',
      'Uses SQL vocabulary like aggregate, total, or accumulated value.',
      'Distinguishes SUM from COUNT by saying COUNT measures rows while SUM adds amounts.',
      'Ties SUM to invoice totals in this script.',
      'Answers clearly and directly.',
    ],
    hardChecklist: [
      'States that the query is calculating supplier spending for a quarter.',
      'Explains that Invoice stores billing amounts while Supplier gives supplier identity.',
      'Explains that grouping by supplier creates one spending total per vendor.',
      'Explains that one grand total would hide which supplier is costing the bakery the most.',
      'Interprets the output as supplier-level cost visibility for purchasing decisions.',
    ],
    knownRiskNotes: [
      'The task says last quarter, but the current query window starts at DATE_TRUNC(quarter, CURRENT_DATE), which reads like the current quarter.',
      'Uses PostgreSQL DATE_TRUNC and INTERVAL syntax that would need MySQL cleanup later.',
      'Still valuable for oral practice because the grouping and spending logic are clear.',
    ],
    status: 'risky',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns supplier identity plus invoice count and total expense.' },
      { clause: 'FROM', why: 'Starts from Invoice because the money being totaled lives in invoice records.' },
      { clause: 'JOIN', why: 'Joins Supplier so the totals can be labeled with the supplier name and contact.' },
      { clause: 'WHERE', why: 'Limits the invoices to the quarter window being analyzed.' },
      { clause: 'GROUP BY', why: 'Creates one result row per supplier so COUNT and SUM are supplier-specific.' },
      { clause: 'ORDER BY', why: 'Sorts the biggest supplier costs first.' },
    ],
  },
  'sql-05': {
    expectedResultDescription: 'Return product name, average rating, review count, and whether the row came from the top-rated or lowest-rated list.',
    expectedResultShape: [
      'Expected columns: ProductName, avg_rating, review_count, category.',
      'Up to six rows total: three highest-rated products and three lowest-rated products.',
    ],
    easyQuestion: 'What does AVG(rt.Score) do here?',
    hardQuestion: 'Why is average rating more meaningful than just counting reviews here?',
    easyChecklist: [
      'Defines AVG as the mean of values inside a group.',
      'Uses SQL vocabulary like average, mean, or aggregate.',
      'Distinguishes AVG from COUNT or SUM.',
      'Ties AVG to review scores in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query compares top-rated and lowest-rated products.',
      'Explains that Review and Rating provide the scores while Product labels the product.',
      'Explains that average rating normalizes products that have different review counts.',
      'Explains that counting reviews alone would measure popularity, not quality.',
      'Interprets the result as a quality signal for menu or improvement decisions.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL ::numeric casting and UNION ALL subqueries with parentheses.',
      'Depends on Review and Rating tables that may not perfectly match every draft ERD version.',
      'Still useful for oral defense because the ranking logic is easy to explain.',
    ],
    status: 'risky',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns product labels, average scores, review counts, and a category label for each ranked list.' },
      { clause: 'FROM', why: 'Starts from Review because each rating observation begins as a review record.' },
      { clause: 'JOIN', why: 'Joins Product for the product name and Rating for the numeric score value.' },
      { clause: 'GROUP BY', why: 'Creates one aggregate group per product so AVG and COUNT are product-specific.' },
      { clause: 'HAVING', why: 'Keeps only products with at least two reviews so one-off ratings do not dominate the list.' },
      { clause: 'ORDER BY', why: 'Ranks each list from best-to-worst or worst-to-best before limiting.' },
      { clause: 'LIMIT', why: 'Restricts each ranked list to three products.' },
      { clause: 'UNION ALL', why: 'Stacks the top-rated and lowest-rated lists into one combined output without removing duplicates.' },
    ],
  },
  'sql-06': {
    expectedResultDescription: 'Return product name, promotion name, before-sales quantity, during-sales quantity, and growth percentage for each promotion-product pair.',
    expectedResultShape: [
      'Expected columns: ProductName, PromotionName, sales_before, sales_during, growth_rate_pct.',
      'One row per product-promotion pair showing baseline quantity, promo quantity, and percent change.',
    ],
    easyQuestion: 'What does a CTE (WITH clause) do?',
    hardQuestion: 'Why do you need separate before-sales and during-sales windows instead of one grouped total?',
    easyChecklist: [
      'Defines a CTE as a named temporary result set inside one query.',
      'Uses SQL vocabulary like WITH clause, common table expression, or intermediate step.',
      'Distinguishes a CTE from a permanent table or saved view.',
      'Ties the explanation to promo_products, before_sales, or during_sales in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is comparing sales before a promotion against sales during the promotion.',
      'Explains that ProductPromotion, Product, Promotion, OrderLine, and Order each provide product links, dates, and sales quantities.',
      'Explains that separate windows are required so a baseline and promo-period number exist for comparison.',
      'Explains that one total would blur pre-promo and during-promo sales together and hide lift.',
      'Interprets the result as a way to judge whether a promotion increased bakery sales.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL DATE casts, INTERVAL, CTE syntax, and ::numeric formatting that would need MySQL adjustment.',
      'Promotion date filtering starts at a hardcoded 2026-01-01, which is study-friendly but still draft logic.',
      'Still highly useful for oral practice because the comparison story is strong.',
    ],
    status: 'risky',
    clauseBreakdown: [
      { clause: 'WITH (CTE)', why: 'Breaks the logic into promo_products, before_sales, and during_sales so the comparison stays readable.' },
      { clause: 'SELECT', why: 'Returns the product, promotion, both sales windows, and the growth calculation.' },
      { clause: 'JOIN', why: 'Uses join paths to connect promotions to products and then to order-line sales.' },
      { clause: 'LEFT JOIN', why: 'Keeps products even when they sold zero units in one of the windows.' },
      { clause: 'GROUP BY', why: 'Creates one quantity total per product-promotion pair inside each sales window.' },
      { clause: 'CASE', why: 'Prevents division by zero when the before-sales value is zero.' },
      { clause: 'ORDER BY', why: 'Sorts the final report in a stable promotion-then-product order for explanation.' },
    ],
  },
  'sql-07': {
    expectedResultDescription: 'Return event type, number of catering orders, total revenue, and average revenue per event type.',
    expectedResultShape: [
      'Expected columns: event_type, number_of_orders, total_revenue, avg_revenue_per_event.',
      'One row per event type with aggregate catering counts and revenue.',
    ],
    easyQuestion: 'What does GROUP BY do here?',
    hardQuestion: 'Why do you need EventType instead of grouping directly on Catering alone?',
    easyChecklist: [
      'Defines GROUP BY as creating groups for aggregate calculations.',
      'Uses SQL vocabulary like grouped rows, aggregate grain, or partition of rows.',
      'Distinguishes GROUP BY from ORDER BY.',
      'Ties GROUP BY to event type in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query summarizes catering revenue by event type.',
      'Explains that Catering provides revenue, Event links each catering order to an event, and EventType provides the type label.',
      'Explains that EventType is needed because Catering alone does not tell you the readable event category.',
      'Explains that grouping only on Catering would stay at transaction level instead of event-type level.',
      'Interprets the result as a way to see which catering segment earns the most money.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL ::numeric casting for AVG formatting.',
      'Otherwise this is one of the cleaner oral-practice scripts in the current set.',
    ],
    status: 'study-ready',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the event type label plus order count, total revenue, and average revenue.' },
      { clause: 'FROM', why: 'Starts from Catering because the money being summarized comes from catering orders.' },
      { clause: 'JOIN', why: 'Joins Event and EventType so each catering order can be classified by event type.' },
      { clause: 'GROUP BY', why: 'Creates one aggregate row per event type.' },
      { clause: 'ORDER BY', why: 'Ranks the highest-revenue event types first.' },
    ],
  },
  'sql-08': {
    expectedResultDescription: 'Return product name, nutrition status, and recipe-derived allergen summary for products that need compliance attention.',
    expectedResultShape: [
      'Expected columns: ProductName, nutritional_status, allergens_from_recipe.',
      'One row per flagged product showing whether nutritional info is missing and which allergens appear in recipe ingredients.',
    ],
    easyQuestion: 'What does LEFT JOIN do?',
    hardQuestion: 'Why is LEFT JOIN better than INNER JOIN for finding missing nutritional information here?',
    easyChecklist: [
      'Defines LEFT JOIN as keeping all rows from the left table even without a match on the right.',
      'Uses SQL vocabulary like unmatched rows, NULL, or outer join.',
      'Distinguishes LEFT JOIN from INNER JOIN by saying INNER JOIN removes unmatched rows.',
      'Ties LEFT JOIN to Product and NutritionalInfo or Recipe in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is trying to flag products with missing nutrition or allergy-related compliance information.',
      'Explains that Product is the base set while NutritionalInfo, Recipe, and AllergyInfo provide compliance details.',
      'Explains that LEFT JOIN preserves every product so missing matches show up as NULL.',
      'Explains that INNER JOIN would remove the exact missing-nutrition products the bakery needs to see.',
      'Interprets the result as a compliance review list rather than a clean production report.',
    ],
    knownRiskNotes: [
      'The task wording says missing nutritional or allergy information, but the current WHERE clause flags products with missing nutrition OR with allergen rows; that is useful for oral logic but still drafty.',
      'Uses PostgreSQL STRING_AGG, CASE ordering, and NULL-handling syntax that may need cleanup for MySQL.',
      'Still useful for oral defense because LEFT JOIN and NULL logic are central exam concepts.',
    ],
    status: 'risky',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the product label, a nutrition-status message, and the allergen summary text.' },
      { clause: 'FROM', why: 'Starts from Product because the bakery wants a product-focused compliance list.' },
      { clause: 'LEFT JOIN', why: 'Keeps every product in the result even when nutrition or recipe rows are missing.' },
      { clause: 'WHERE', why: 'Flags products either missing nutrition or connected to allergen information for review.' },
      { clause: 'GROUP BY', why: 'Creates one output row per product so STRING_AGG can combine allergen names.' },
      { clause: 'ORDER BY', why: 'Pushes the missing-nutrition items to the top before sorting by product name.' },
    ],
  },
  'sql-09': {
    expectedResultDescription: 'Return category name, order count, total units sold, and total sales for each product category this quarter.',
    expectedResultShape: [
      'Expected columns: CategoryName, order_count, total_units_sold, total_sales.',
      'One row per product category with quarter-to-date order, unit, and revenue totals.',
    ],
    easyQuestion: 'What does COUNT(DISTINCT o.OrderID) do here?',
    hardQuestion: 'Why is OrderLine usually the right base table for category sales instead of Order?',
    easyChecklist: [
      'Defines COUNT DISTINCT as counting unique values only.',
      'Uses SQL vocabulary like duplicates, unique rows, or deduplication.',
      'Distinguishes COUNT DISTINCT from plain COUNT.',
      'Ties it to OrderID in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is measuring sales by product category.',
      'Explains that OrderLine holds quantity and unit price while Product and ProductCategory provide the category label.',
      'Explains that OrderLine is needed because category sales happen at line-item level, not at whole-order level.',
      'Explains that using Order alone would give order totals with no category breakdown.',
      'Interprets the result as category performance for bakery revenue planning.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL DATE_TRUNC and INTERVAL quarter syntax that will need MySQL cleanup later.',
      'Still a strong oral-practice script because line-item revenue logic is clear.',
    ],
    status: 'draft',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the category label plus order, unit, and revenue totals.' },
      { clause: 'FROM', why: 'Starts from OrderLine because category sales are measured at the line-item level.' },
      { clause: 'JOIN', why: 'Joins Order for date and status, Product for product identity, and ProductCategory for the category name.' },
      { clause: 'WHERE', why: 'Limits the rows to the quarter window and fulfilled order statuses.' },
      { clause: 'GROUP BY', why: 'Creates one aggregate row per product category.' },
      { clause: 'ORDER BY', why: 'Ranks categories from highest revenue to lowest.' },
    ],
  },
  'sql-10': {
    expectedResultDescription: 'Return customer name, email, total orders, and total spending for the top five spenders in the past year.',
    expectedResultShape: [
      'Expected columns: CustomerID, customer_name, Email, total_orders, total_spending.',
      'Five rows maximum, one per customer, ranked by total_spending.',
    ],
    easyQuestion: 'What does LIMIT 5 do?',
    hardQuestion: 'Why is total spending a different metric from total orders?',
    easyChecklist: [
      'Defines LIMIT as restricting the final number of rows returned.',
      'Uses SQL vocabulary like top-N, capped output, or final result limit.',
      'Distinguishes LIMIT from WHERE by saying WHERE filters rows before output while LIMIT trims the final sorted set.',
      'Ties LIMIT 5 to the top-spender ranking in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is looking for the biggest spenders over the last year.',
      'Explains that Customer provides identity while Order provides spending amounts and dates.',
      'Explains that total spending measures dollars while total orders only measures transaction count.',
      'Explains that a customer with fewer large orders can outrank one with many small orders.',
      'Interprets the result as the bakerys highest-value customer segment.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL string concatenation with || and INTERVAL syntax.',
      'Still useful for oral defense because top-N and revenue-vs-count explanations are common exam topics.',
    ],
    status: 'draft',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns customer identity plus order count and total spending.' },
      { clause: 'FROM', why: 'Starts from Customer because the report grain is one row per customer.' },
      { clause: 'JOIN', why: 'Joins Order so the script can total each customers fulfilled orders.' },
      { clause: 'WHERE', why: 'Limits the data to the last year and to fulfilled order statuses.' },
      { clause: 'GROUP BY', why: 'Creates one aggregate group per customer.' },
      { clause: 'ORDER BY', why: 'Ranks the biggest spenders first.' },
      { clause: 'LIMIT', why: 'Keeps only the top five customers after ranking.' },
    ],
  },
  'sql-11': {
    expectedResultDescription: 'Return product name, category name, total quantity sold, and total revenue for the top five products by volume last month.',
    expectedResultShape: [
      'Expected columns: ProductName, CategoryName, total_quantity_sold, total_revenue.',
      'Five rows maximum, one per product, ranked by quantity sold during the previous month.',
    ],
    easyQuestion: 'What does SUM(ol.Quantity) do here?',
    hardQuestion: 'Why might top-selling by volume differ from top-selling by revenue?',
    easyChecklist: [
      'Defines SUM as adding values inside each group.',
      'Uses terms like total units, aggregate, or volume.',
      'Distinguishes SUM(quantity) from SUM(revenue).',
      'Ties SUM(ol.Quantity) to units sold in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is ranking products by sales volume last month.',
      'Explains that OrderLine provides quantity and price while Product and ProductCategory label each product.',
      'Explains that volume counts units moved while revenue measures dollars earned.',
      'Explains that a cheap product can win on quantity without winning on revenue.',
      'Interprets the result as a production or stocking signal for the bakery.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL DATE_TRUNC and quoted "Order" syntax that will need MySQL cleanup later.',
      'Still a strong oral-practice script because the volume-vs-revenue distinction is exam-friendly.',
    ],
    status: 'draft',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns product and category labels plus unit and revenue totals.' },
      { clause: 'FROM', why: 'Starts from OrderLine because units sold are tracked at line-item level.' },
      { clause: 'JOIN', why: 'Joins Order for dates, Product for product names, and ProductCategory for category labels.' },
      { clause: 'WHERE', why: 'Limits the rows to last month and to fulfilled orders only.' },
      { clause: 'GROUP BY', why: 'Creates one row per product and category pairing.' },
      { clause: 'ORDER BY', why: 'Ranks the highest-volume products first.' },
      { clause: 'LIMIT', why: 'Keeps only the top five products after ranking.' },
    ],
  },
  'sql-12': {
    expectedResultDescription: 'Return time range, order count, total revenue, and average order value for each sales-hour bucket.',
    expectedResultShape: [
      'Expected columns: time_range, order_count, total_revenue, avg_order_value.',
      'One row per CASE-generated time bucket showing how busy and how valuable that window is.',
    ],
    easyQuestion: 'What does CASE do?',
    hardQuestion: 'Why create hour buckets instead of listing every individual timestamp?',
    easyChecklist: [
      'Defines CASE as conditional logic that returns different values based on conditions.',
      'Uses SQL vocabulary like condition, branch, or if-then style expression.',
      'Distinguishes CASE from WHERE by saying CASE changes output values while WHERE removes rows.',
      'Ties CASE to the time_range buckets in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is finding the busiest parts of the day.',
      'Explains that Order holds the timestamps needed for hour extraction and revenue aggregation.',
      'Explains that hour buckets group many timestamps into a small number of meaningful windows.',
      'Explains that listing every timestamp would create too many rows and no useful pattern.',
      'Interprets the result as a staffing or prep-planning guide for the bakery.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL EXTRACT syntax and CASE bucketing that may need dialect cleanup later.',
      'The query looks at all completed/delivered orders, not a narrower recent window; still fine for oral practice because the bucket logic is the core concept.',
    ],
    status: 'draft',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the time bucket label plus order count, revenue, and average order value.' },
      { clause: 'CASE', why: 'Converts raw order hours into named two-hour buckets that are easier to explain than raw timestamps.' },
      { clause: 'FROM', why: 'Starts from Order because the timestamps and order totals live there.' },
      { clause: 'WHERE', why: 'Keeps only fulfilled orders in the time-bucket analysis.' },
      { clause: 'GROUP BY', why: 'Creates one aggregate row per time_range bucket.' },
      { clause: 'ORDER BY', why: 'Ranks the busiest buckets first by order count.' },
    ],
  },
  'sql-13': {
    expectedResultDescription: 'Return ingredient name, unit, total waste, waste incidents, and aggregated waste reasons for the top five most-wasted ingredients.',
    expectedResultShape: [
      'Expected columns: IngredientName, unit, total_waste, waste_incidents, reasons.',
      'Five rows maximum, one per ingredient, ranked by total_waste.',
    ],
    easyQuestion: 'What does ORDER BY total_waste DESC do here?',
    hardQuestion: 'Why is WasteLog the correct source instead of Inventory?',
    easyChecklist: [
      'Defines ORDER BY DESC as sorting from highest to lowest.',
      'Uses SQL vocabulary like rank or descending sort.',
      'Distinguishes ORDER BY from GROUP BY.',
      'Ties the sort to total_waste in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is finding which ingredients generate the most waste.',
      'Explains that WasteLog stores waste events while Ingredient provides readable ingredient labels and units.',
      'Explains that WasteLog is the right source because it tracks thrown-away quantity, not current stock on hand.',
      'Explains that Inventory would show stock levels, not historical waste behavior.',
      'Interprets the result as a waste-reduction target list for the bakery.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL STRING_AGG and INTERVAL syntax that will need MySQL cleanup later.',
      'Still a strong oral-practice script because it cleanly contrasts WasteLog with Inventory.',
    ],
    status: 'draft',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns ingredient labels plus waste totals, incident counts, and concatenated reasons.' },
      { clause: 'FROM', why: 'Starts from WasteLog because every metric in the report comes from waste events.' },
      { clause: 'JOIN', why: 'Joins Ingredient so the bakery sees ingredient names and units, not only IDs.' },
      { clause: 'WHERE', why: 'Limits the report to waste logged in the last year.' },
      { clause: 'GROUP BY', why: 'Creates one aggregate row per ingredient.' },
      { clause: 'ORDER BY', why: 'Ranks the highest total waste first.' },
      { clause: 'LIMIT', why: 'Keeps only the top five ingredients after ranking.' },
    ],
  },
  'sql-14': {
    expectedResultDescription: 'Return channel, number of orders, sales revenue, and percent of total sales for each sales channel last month.',
    expectedResultShape: [
      'Expected columns: channel, number_of_orders, sales_revenue, pct_of_total.',
      'One row per sales channel with both raw revenue and its percent contribution to monthly sales.',
    ],
    easyQuestion: 'What does GROUP BY o.SalesChannel do?',
    hardQuestion: 'Why is revenue by channel more useful than just order count by channel?',
    easyChecklist: [
      'Defines GROUP BY as building one group per sales channel.',
      'Uses SQL vocabulary like grouping, partitioning, or aggregate grain.',
      'Distinguishes GROUP BY from ORDER BY.',
      'Ties GROUP BY to SalesChannel in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query summarizes sales performance by channel.',
      'Explains that Order supplies both channel labels and order totals, while the CTE supplies the grand total for percentage math.',
      'Explains that revenue shows dollar impact while order count only shows transaction volume.',
      'Explains that a channel with fewer orders can still matter more if those orders are larger.',
      'Interprets the result as channel-mix analysis for bakery sales decisions.',
    ],
    knownRiskNotes: [
      'Uses PostgreSQL CTE, CROSS JOIN, DATE_TRUNC, INTERVAL, and ::numeric syntax that will need MySQL cleanup later.',
      'Still highly useful for oral defense because it demonstrates percentage-of-total reasoning clearly.',
    ],
    status: 'risky',
    clauseBreakdown: [
      { clause: 'WITH (CTE)', why: 'Pre-computes the monthly grand total once so every channel can compare itself to the same total.' },
      { clause: 'SELECT', why: 'Returns the sales channel plus order count, revenue, and percent-of-total.' },
      { clause: 'FROM', why: 'Starts from Order because channel, order totals, and dates all live there.' },
      { clause: 'CROSS JOIN', why: 'Attaches the single grand_total row from the CTE to every channel row so the percentage can be calculated.' },
      { clause: 'WHERE', why: 'Keeps only fulfilled orders from the previous month in both the CTE and main query.' },
      { clause: 'GROUP BY', why: 'Creates one result row per sales channel.' },
      { clause: 'ORDER BY', why: 'Ranks the highest-revenue channels first.' },
    ],
  },
  'sql-15': {
    expectedResultDescription: 'Return holiday name, product name, total units sold, and total revenue for products sold during holiday-tagged periods.',
    expectedResultShape: [
      'Expected columns: HolidayName, ProductName, total_sold, total_revenue.',
      'One row per holiday and product combination, showing how much of that product sold during that holiday period.',
    ],
    easyQuestion: 'What does a date or season filter usually do in a holiday query?',
    hardQuestion: 'How is holiday season being defined in this current script, and why does that choice matter?',
    easyChecklist: [
      'Defines a date or season filter as restricting rows to a specific time or event window.',
      'Uses SQL vocabulary like temporal filter, range, or boundary.',
      'Distinguishes a season filter from a generic WHERE by focusing on time or event scope.',
      'Ties the explanation to holiday-linked rows in this script.',
      'Answers directly.',
    ],
    hardChecklist: [
      'States that the query is trying to find popular products during holiday periods.',
      'Explains that HolidaySale links holiday context to orders, while OrderLine and Product provide what was sold.',
      'Explains that the current script defines seasonality through the HolidaySale association rather than a raw date predicate.',
      'Explains that the way holiday scope is defined changes which orders count as seasonal sales.',
      'Interprets the result as holiday demand insight for bakery planning and marketing.',
    ],
    knownRiskNotes: [
      'The current script depends on HolidaySale as the holiday-season definition; if the final design changes, the join path may change too.',
      'There is no separate raw date filter here, so the seasonal definition fully depends on how HolidaySale was populated.',
      'Still useful for oral defense because the associative-table story is clear.',
    ],
    status: 'draft',
    clauseBreakdown: [
      { clause: 'SELECT', why: 'Returns the holiday label, product label, and the two sales metrics the bakery wants to compare.' },
      { clause: 'FROM', why: 'Starts from HolidaySale because that associative table defines which orders belong to each holiday analysis.' },
      { clause: 'JOIN', why: 'Follows the path from holiday tag to order, then to order lines, then to product names.' },
      { clause: 'WHERE', why: 'Keeps only completed or delivered orders in the holiday analysis.' },
      { clause: 'GROUP BY', why: 'Creates one aggregate row per holiday and product pair.' },
      { clause: 'ORDER BY', why: 'Keeps each holiday together and ranks products by sales volume inside each holiday.' },
    ],
  },
};

export const sqlRequirements = (baseData as SqlRequirement[]).map((item) => {
  const extra = requirementMeta[item.id];
  const officialTask = item.desc;
  const easyQuestion = extra?.easyQuestion;
  const hardQuestion = extra?.hardQuestion;
  const oralQuestions = easyQuestion || hardQuestion
    ? [
        easyQuestion,
        hardQuestion,
        'What does one output row represent in business terms?',
        'Which table path would you explain first if the professor asks why the joins are needed?',
        'What is the main draft risk you would mention without pretending the script is perfect?',
      ].filter(Boolean) as string[]
    : item.oralQuestions;

  return {
    ...item,
    ...extra,
    desc: officialTask,
    officialTask,
    currentScriptSource: 'teammate_html' as const,
    currentMeaning: item.businessMeaning,
    oralQuestions,
    keyClauses: extra?.clauseBreakdown?.map((entry) => entry.clause) ?? item.clauseBreakdown?.map((entry) => entry.clause),
  };
});

export default sqlRequirements;
