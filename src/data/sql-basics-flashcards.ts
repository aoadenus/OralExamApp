export interface SqlBasicsFlashcard {
  id: string;
  category: 'Foundations' | 'Filtering and Sorting' | 'Aggregates and Grouping' | 'Joins' | 'Oral Exam Thinking';
  front: string;
  back: string;
}

export const sqlBasicsClauseOrder = 'SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY -> LIMIT';

export const sqlBasicsStudySequence = [
  'Memorize the clause order first.',
  'Learn SELECT, FROM, WHERE, ORDER BY, and LIMIT.',
  'Learn COUNT, SUM, AVG, GROUP BY, and HAVING.',
  'Learn JOIN, INNER JOIN, LEFT JOIN, and the ON clause.',
  'Go back to the 15 functionality scripts and label each clause.',
];

const sqlBasicsFlashcards: SqlBasicsFlashcard[] = [
  {
    id: 'sql-basics-01',
    category: 'Foundations',
    front: 'What is SQL?',
    back: 'SQL is the language used to ask questions of a database, retrieve data, change data, and summarize data.',
  },
  {
    id: 'sql-basics-02',
    category: 'Foundations',
    front: 'What does SELECT do?',
    back: 'It chooses which columns or expressions appear in the result.',
  },
  {
    id: 'sql-basics-03',
    category: 'Foundations',
    front: 'What does FROM do?',
    back: 'It tells SQL which table the data is coming from.',
  },
  {
    id: 'sql-basics-04',
    category: 'Foundations',
    front: 'What does SELECT * mean?',
    back: 'It returns all columns from the table.',
  },
  {
    id: 'sql-basics-05',
    category: 'Foundations',
    front: 'What is a table in SQL?',
    back: 'A table is a structured set of rows and columns that stores related data.',
  },
  {
    id: 'sql-basics-06',
    category: 'Foundations',
    front: 'What is a row?',
    back: 'A row is one record in a table.',
  },
  {
    id: 'sql-basics-07',
    category: 'Foundations',
    front: 'What is a column?',
    back: 'A column is one field or attribute in a table.',
  },
  {
    id: 'sql-basics-08',
    category: 'Foundations',
    front: 'What is a primary key?',
    back: 'A primary key uniquely identifies each row in a table.',
  },
  {
    id: 'sql-basics-09',
    category: 'Foundations',
    front: 'What is a foreign key?',
    back: 'A foreign key links one table to another by referencing a primary key in another table.',
  },
  {
    id: 'sql-basics-10',
    category: 'Foundations',
    front: 'What is the normal SQL clause order?',
    back: 'SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY -> LIMIT',
  },
  {
    id: 'sql-basics-11',
    category: 'Filtering and Sorting',
    front: 'What does WHERE do?',
    back: 'It filters rows before grouping or aggregation.',
  },
  {
    id: 'sql-basics-12',
    category: 'Filtering and Sorting',
    front: 'What does = do in SQL?',
    back: 'It checks whether two values are equal.',
  },
  {
    id: 'sql-basics-13',
    category: 'Filtering and Sorting',
    front: 'What does <> or != mean?',
    back: 'It means not equal to.',
  },
  {
    id: 'sql-basics-14',
    category: 'Filtering and Sorting',
    front: 'What does > mean?',
    back: 'It keeps values greater than a comparison value.',
  },
  {
    id: 'sql-basics-15',
    category: 'Filtering and Sorting',
    front: 'What does < mean?',
    back: 'It keeps values less than a comparison value.',
  },
  {
    id: 'sql-basics-16',
    category: 'Filtering and Sorting',
    front: 'What does AND do?',
    back: 'It requires both conditions to be true.',
  },
  {
    id: 'sql-basics-17',
    category: 'Filtering and Sorting',
    front: 'What does OR do?',
    back: 'It requires at least one condition to be true.',
  },
  {
    id: 'sql-basics-18',
    category: 'Filtering and Sorting',
    front: 'What does NOT do?',
    back: 'It reverses a condition.',
  },
  {
    id: 'sql-basics-19',
    category: 'Filtering and Sorting',
    front: 'What does LIKE do?',
    back: 'It searches for a pattern in text, often using wildcards like %.',
  },
  {
    id: 'sql-basics-20',
    category: 'Filtering and Sorting',
    front: 'What does ORDER BY do?',
    back: 'It sorts the final result set.',
  },
  {
    id: 'sql-basics-21',
    category: 'Filtering and Sorting',
    front: 'What does ASC mean?',
    back: 'Ascending order: low to high, or A to Z.',
  },
  {
    id: 'sql-basics-22',
    category: 'Filtering and Sorting',
    front: 'What does DESC mean?',
    back: 'Descending order: high to low, or Z to A.',
  },
  {
    id: 'sql-basics-23',
    category: 'Filtering and Sorting',
    front: 'What does LIMIT do?',
    back: 'It restricts how many rows are returned.',
  },
  {
    id: 'sql-basics-24',
    category: 'Aggregates and Grouping',
    front: 'What does COUNT() do?',
    back: 'It counts rows or non-null values.',
  },
  {
    id: 'sql-basics-25',
    category: 'Aggregates and Grouping',
    front: 'What does SUM() do?',
    back: 'It adds numeric values together.',
  },
  {
    id: 'sql-basics-26',
    category: 'Aggregates and Grouping',
    front: 'What does AVG() do?',
    back: 'It calculates the average of numeric values.',
  },
  {
    id: 'sql-basics-27',
    category: 'Aggregates and Grouping',
    front: 'What does MIN() do?',
    back: 'It returns the smallest value in a set.',
  },
  {
    id: 'sql-basics-28',
    category: 'Aggregates and Grouping',
    front: 'What does MAX() do?',
    back: 'It returns the largest value in a set.',
  },
  {
    id: 'sql-basics-29',
    category: 'Aggregates and Grouping',
    front: 'What does GROUP BY do?',
    back: 'It groups rows into buckets so aggregate functions can calculate within each group.',
  },
  {
    id: 'sql-basics-30',
    category: 'Aggregates and Grouping',
    front: 'What does HAVING do?',
    back: 'It filters grouped results after aggregation.',
  },
  {
    id: 'sql-basics-31',
    category: 'Aggregates and Grouping',
    front: 'What is the difference between WHERE and HAVING?',
    back: 'WHERE filters rows before grouping. HAVING filters groups after grouping.',
  },
  {
    id: 'sql-basics-32',
    category: 'Aggregates and Grouping',
    front: 'What does COUNT(DISTINCT column) do?',
    back: 'It counts unique values only, which helps avoid duplicate overcounting.',
  },
  {
    id: 'sql-basics-33',
    category: 'Aggregates and Grouping',
    front: 'What does one row per customer mean?',
    back: 'It means the final grouped result has one result row for each customer.',
  },
  {
    id: 'sql-basics-34',
    category: 'Joins',
    front: 'What does JOIN do?',
    back: 'It connects related tables so a query can use data from more than one table.',
  },
  {
    id: 'sql-basics-35',
    category: 'Joins',
    front: 'What does INNER JOIN do?',
    back: 'It returns only rows that match in both tables.',
  },
  {
    id: 'sql-basics-36',
    category: 'Joins',
    front: 'What does LEFT JOIN do?',
    back: 'It keeps all rows from the left table, even if there is no matching row in the right table.',
  },
  {
    id: 'sql-basics-37',
    category: 'Joins',
    front: 'Why do we use joins in a normalized database?',
    back: 'Data is split across related tables, so joins reconnect it when answering a business question.',
  },
  {
    id: 'sql-basics-38',
    category: 'Joins',
    front: 'What is the ON clause in a join?',
    back: 'It tells SQL how the tables are related, usually by matching a foreign key to a primary key.',
  },
  {
    id: 'sql-basics-39',
    category: 'Oral Exam Thinking',
    front: 'If Hu asks, What does this query return?, what should you say?',
    back: 'Explain the business question, what each result row represents, what the key columns mean, and how the result is sorted or filtered.',
  },
  {
    id: 'sql-basics-40',
    category: 'Oral Exam Thinking',
    front: 'If Hu asks, Why is this WHERE / HAVING / JOIN here?, what should you say?',
    back: 'Explain what that clause does in general, what it does in this specific query, and what would go wrong without it.',
  },
];

export default sqlBasicsFlashcards;
