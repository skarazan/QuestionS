import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TOTAL_QUESTIONS = 1000;

// ============================================
// ~100 SAT Math question templates
// Each has: text, difficulty, explanation, and 4 options with exactly one correct.
// ============================================

const TEMPLATES = [
  // ---------- ALGEBRA (linear equations, systems, inequalities) ----------
  {
    text: "If 3x + 5 = 20, what is the value of x?",
    difficulty: "EASY",
    explanation: "Subtract 5 from both sides: 3x = 15. Divide by 3: x = 5.",
    options: [
      { text: "3", isCorrect: false },
      { text: "5", isCorrect: true },
      { text: "7", isCorrect: false },
      { text: "15", isCorrect: false },
    ],
  },
  {
    text: "If 2x − 7 = 11, what is x?",
    difficulty: "EASY",
    explanation: "Add 7: 2x = 18. Divide by 2: x = 9.",
    options: [
      { text: "7", isCorrect: false },
      { text: "8", isCorrect: false },
      { text: "9", isCorrect: true },
      { text: "11", isCorrect: false },
    ],
  },
  {
    text: "Solve for x: 4(x − 3) = 16.",
    difficulty: "EASY",
    explanation: "Divide by 4: x − 3 = 4. Add 3: x = 7.",
    options: [
      { text: "4", isCorrect: false },
      { text: "5", isCorrect: false },
      { text: "7", isCorrect: true },
      { text: "10", isCorrect: false },
    ],
  },
  {
    text: "If (x/5) + 2 = 6, what is x?",
    difficulty: "EASY",
    explanation: "Subtract 2: x/5 = 4. Multiply by 5: x = 20.",
    options: [
      { text: "10", isCorrect: false },
      { text: "15", isCorrect: false },
      { text: "20", isCorrect: true },
      { text: "30", isCorrect: false },
    ],
  },
  {
    text: "If 5 − 2x = 13, what is x?",
    difficulty: "EASY",
    explanation: "Subtract 5: −2x = 8. Divide by −2: x = −4.",
    options: [
      { text: "−4", isCorrect: true },
      { text: "−2", isCorrect: false },
      { text: "4", isCorrect: false },
      { text: "9", isCorrect: false },
    ],
  },
  {
    text: "The equation y = 3x + 7 represents a line. What is the slope?",
    difficulty: "EASY",
    explanation: "In y = mx + b, m is the slope. Here m = 3.",
    options: [
      { text: "−3", isCorrect: false },
      { text: "3", isCorrect: true },
      { text: "7", isCorrect: false },
      { text: "10", isCorrect: false },
    ],
  },
  {
    text: "What is the y-intercept of the line y = −2x + 9?",
    difficulty: "EASY",
    explanation: "The y-intercept is the constant term, b = 9.",
    options: [
      { text: "−2", isCorrect: false },
      { text: "2", isCorrect: false },
      { text: "7", isCorrect: false },
      { text: "9", isCorrect: true },
    ],
  },
  {
    text: "A line passes through (0, 4) and (2, 10). What is its slope?",
    difficulty: "EASY",
    explanation: "Slope = (10 − 4)/(2 − 0) = 6/2 = 3.",
    options: [
      { text: "2", isCorrect: false },
      { text: "3", isCorrect: true },
      { text: "4", isCorrect: false },
      { text: "6", isCorrect: false },
    ],
  },
  {
    text: "If f(x) = 2x + 1, what is f(5)?",
    difficulty: "EASY",
    explanation: "f(5) = 2(5) + 1 = 11.",
    options: [
      { text: "7", isCorrect: false },
      { text: "9", isCorrect: false },
      { text: "11", isCorrect: true },
      { text: "12", isCorrect: false },
    ],
  },
  {
    text: "If x + y = 10 and x − y = 2, what is x?",
    difficulty: "MEDIUM",
    explanation: "Add the equations: 2x = 12, so x = 6.",
    options: [
      { text: "4", isCorrect: false },
      { text: "5", isCorrect: false },
      { text: "6", isCorrect: true },
      { text: "8", isCorrect: false },
    ],
  },
  {
    text: "If 2x + 3y = 12 and y = 2, what is x?",
    difficulty: "EASY",
    explanation: "Substitute y = 2: 2x + 6 = 12, so 2x = 6, x = 3.",
    options: [
      { text: "2", isCorrect: false },
      { text: "3", isCorrect: true },
      { text: "4", isCorrect: false },
      { text: "6", isCorrect: false },
    ],
  },
  {
    text: "Solve: 3x + 2 > 11.",
    difficulty: "EASY",
    explanation: "Subtract 2: 3x > 9. Divide by 3: x > 3.",
    options: [
      { text: "x > 3", isCorrect: true },
      { text: "x < 3", isCorrect: false },
      { text: "x > 9", isCorrect: false },
      { text: "x ≥ 3", isCorrect: false },
    ],
  },
  {
    text: "If 4x − 1 ≤ 2x + 7, what is the solution?",
    difficulty: "MEDIUM",
    explanation: "Subtract 2x: 2x − 1 ≤ 7. Add 1: 2x ≤ 8. Divide: x ≤ 4.",
    options: [
      { text: "x ≤ 2", isCorrect: false },
      { text: "x ≤ 4", isCorrect: true },
      { text: "x ≥ 4", isCorrect: false },
      { text: "x < 8", isCorrect: false },
    ],
  },
  {
    text: "A taxi charges $3 plus $2 per mile. What is the cost of an 8-mile ride?",
    difficulty: "EASY",
    explanation: "Cost = 3 + 2(8) = 3 + 16 = $19.",
    options: [
      { text: "$16", isCorrect: false },
      { text: "$18", isCorrect: false },
      { text: "$19", isCorrect: true },
      { text: "$24", isCorrect: false },
    ],
  },
  {
    text: "Which equation represents a line with slope −2 passing through (1, 4)?",
    difficulty: "MEDIUM",
    explanation: "Point-slope: y − 4 = −2(x − 1) ⇒ y = −2x + 6.",
    options: [
      { text: "y = −2x + 6", isCorrect: true },
      { text: "y = −2x − 2", isCorrect: false },
      { text: "y = 2x + 2", isCorrect: false },
      { text: "y = −2x + 4", isCorrect: false },
    ],
  },
  {
    text: "What is the solution to the system: x + y = 7, 2x − y = 2?",
    difficulty: "MEDIUM",
    explanation: "Add: 3x = 9, so x = 3. Then y = 7 − 3 = 4.",
    options: [
      { text: "(2, 5)", isCorrect: false },
      { text: "(3, 4)", isCorrect: true },
      { text: "(4, 3)", isCorrect: false },
      { text: "(5, 2)", isCorrect: false },
    ],
  },
  {
    text: "If 7 − 3x = 4, what is x?",
    difficulty: "EASY",
    explanation: "−3x = −3 ⇒ x = 1.",
    options: [
      { text: "0", isCorrect: false },
      { text: "1", isCorrect: true },
      { text: "2", isCorrect: false },
      { text: "3", isCorrect: false },
    ],
  },
  {
    text: "A line has equation 2x + 3y = 12. What is the x-intercept?",
    difficulty: "MEDIUM",
    explanation: "Set y = 0: 2x = 12 ⇒ x = 6.",
    options: [
      { text: "2", isCorrect: false },
      { text: "4", isCorrect: false },
      { text: "6", isCorrect: true },
      { text: "12", isCorrect: false },
    ],
  },
  {
    text: "If g(x) = 5 − x, what is g(−3)?",
    difficulty: "EASY",
    explanation: "g(−3) = 5 − (−3) = 8.",
    options: [
      { text: "−8", isCorrect: false },
      { text: "2", isCorrect: false },
      { text: "5", isCorrect: false },
      { text: "8", isCorrect: true },
    ],
  },
  {
    text: "Two lines are parallel. One has slope 4. What is the slope of the other?",
    difficulty: "EASY",
    explanation: "Parallel lines have equal slopes.",
    options: [
      { text: "−4", isCorrect: false },
      { text: "−1/4", isCorrect: false },
      { text: "1/4", isCorrect: false },
      { text: "4", isCorrect: true },
    ],
  },
  {
    text: "Two lines are perpendicular. One has slope 2. What is the slope of the other?",
    difficulty: "MEDIUM",
    explanation: "Perpendicular slopes are negative reciprocals: −1/2.",
    options: [
      { text: "−2", isCorrect: false },
      { text: "−1/2", isCorrect: true },
      { text: "1/2", isCorrect: false },
      { text: "2", isCorrect: false },
    ],
  },
  {
    text: "If 2(x + 3) = 4x − 2, what is x?",
    difficulty: "MEDIUM",
    explanation: "2x + 6 = 4x − 2 ⇒ 8 = 2x ⇒ x = 4.",
    options: [
      { text: "2", isCorrect: false },
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
      { text: "5", isCorrect: false },
    ],
  },
  {
    text: "What is the slope of the line through (−1, 2) and (3, 10)?",
    difficulty: "EASY",
    explanation: "(10 − 2)/(3 − (−1)) = 8/4 = 2.",
    options: [
      { text: "1", isCorrect: false },
      { text: "2", isCorrect: true },
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: false },
    ],
  },
  {
    text: "If |x − 4| = 3, what are the possible values of x?",
    difficulty: "MEDIUM",
    explanation: "x − 4 = ±3 ⇒ x = 7 or x = 1.",
    options: [
      { text: "1 or 7", isCorrect: true },
      { text: "−3 or 3", isCorrect: false },
      { text: "3 or 4", isCorrect: false },
      { text: "4 or 7", isCorrect: false },
    ],
  },
  {
    text: "A line has y-intercept 5 and passes through (2, 9). What is its slope?",
    difficulty: "MEDIUM",
    explanation: "(9 − 5)/(2 − 0) = 4/2 = 2.",
    options: [
      { text: "1", isCorrect: false },
      { text: "2", isCorrect: true },
      { text: "4", isCorrect: false },
      { text: "5", isCorrect: false },
    ],
  },
  {
    text: "If 3x + 2y = 14 and x = 2, what is y?",
    difficulty: "EASY",
    explanation: "3(2) + 2y = 14 ⇒ 2y = 8 ⇒ y = 4.",
    options: [
      { text: "2", isCorrect: false },
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
      { text: "6", isCorrect: false },
    ],
  },
  {
    text: "If 6x = 3(x + 4), what is x?",
    difficulty: "EASY",
    explanation: "6x = 3x + 12 ⇒ 3x = 12 ⇒ x = 4.",
    options: [
      { text: "2", isCorrect: false },
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
      { text: "6", isCorrect: false },
    ],
  },
  {
    text: "What is the value of x in (x − 1)/3 = 4?",
    difficulty: "EASY",
    explanation: "x − 1 = 12 ⇒ x = 13.",
    options: [
      { text: "11", isCorrect: false },
      { text: "12", isCorrect: false },
      { text: "13", isCorrect: true },
      { text: "15", isCorrect: false },
    ],
  },
  {
    text: "If x + 2y = 8 and x − 2y = 0, what is y?",
    difficulty: "MEDIUM",
    explanation: "Subtract: 4y = 8 ⇒ y = 2.",
    options: [
      { text: "1", isCorrect: false },
      { text: "2", isCorrect: true },
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: false },
    ],
  },
  {
    text: "Which line is parallel to y = 2x + 1?",
    difficulty: "EASY",
    explanation: "Same slope (2) is required for parallel.",
    options: [
      { text: "y = −2x + 1", isCorrect: false },
      { text: "y = 2x − 5", isCorrect: true },
      { text: "y = x + 2", isCorrect: false },
      { text: "y = 3x + 1", isCorrect: false },
    ],
  },

  // ---------- ADVANCED MATH (quadratics, exponents, polynomials, functions) ----------
  {
    text: "What are the solutions to x² − 5x + 6 = 0?",
    difficulty: "MEDIUM",
    explanation: "Factor: (x − 2)(x − 3) = 0 ⇒ x = 2 or x = 3.",
    options: [
      { text: "1 and 6", isCorrect: false },
      { text: "2 and 3", isCorrect: true },
      { text: "−2 and −3", isCorrect: false },
      { text: "−1 and −6", isCorrect: false },
    ],
  },
  {
    text: "What are the solutions to x² − 9 = 0?",
    difficulty: "EASY",
    explanation: "x² = 9 ⇒ x = ±3.",
    options: [
      { text: "only 3", isCorrect: false },
      { text: "−3 and 3", isCorrect: true },
      { text: "0 and 9", isCorrect: false },
      { text: "−9 and 9", isCorrect: false },
    ],
  },
  {
    text: "What is the vertex of y = (x − 2)² + 3?",
    difficulty: "MEDIUM",
    explanation: "Vertex form (x − h)² + k has vertex (h, k) = (2, 3).",
    options: [
      { text: "(−2, 3)", isCorrect: false },
      { text: "(2, 3)", isCorrect: true },
      { text: "(2, −3)", isCorrect: false },
      { text: "(3, 2)", isCorrect: false },
    ],
  },
  {
    text: "What is (x + 3)(x − 4) expanded?",
    difficulty: "EASY",
    explanation: "x² − 4x + 3x − 12 = x² − x − 12.",
    options: [
      { text: "x² + x − 12", isCorrect: false },
      { text: "x² − x − 12", isCorrect: true },
      { text: "x² − 7x − 12", isCorrect: false },
      { text: "x² + 7x + 12", isCorrect: false },
    ],
  },
  {
    text: "Factor: x² − 7x + 12.",
    difficulty: "MEDIUM",
    explanation: "(x − 3)(x − 4).",
    options: [
      { text: "(x − 2)(x − 6)", isCorrect: false },
      { text: "(x − 3)(x − 4)", isCorrect: true },
      { text: "(x + 3)(x + 4)", isCorrect: false },
      { text: "(x − 1)(x − 12)", isCorrect: false },
    ],
  },
  {
    text: "Simplify: (x²)(x³).",
    difficulty: "EASY",
    explanation: "Add exponents: x^(2+3) = x^5.",
    options: [
      { text: "x^5", isCorrect: true },
      { text: "x^6", isCorrect: false },
      { text: "2x^5", isCorrect: false },
      { text: "x^(2/3)", isCorrect: false },
    ],
  },
  {
    text: "Simplify: (x^6)/(x^2).",
    difficulty: "EASY",
    explanation: "Subtract exponents: x^4.",
    options: [
      { text: "x^3", isCorrect: false },
      { text: "x^4", isCorrect: true },
      { text: "x^8", isCorrect: false },
      { text: "x^12", isCorrect: false },
    ],
  },
  {
    text: "What is (2x²)³?",
    difficulty: "MEDIUM",
    explanation: "2³ · x^(2·3) = 8x^6.",
    options: [
      { text: "2x^5", isCorrect: false },
      { text: "6x^6", isCorrect: false },
      { text: "8x^5", isCorrect: false },
      { text: "8x^6", isCorrect: true },
    ],
  },
  {
    text: "If 2^x = 32, what is x?",
    difficulty: "EASY",
    explanation: "32 = 2^5 ⇒ x = 5.",
    options: [
      { text: "4", isCorrect: false },
      { text: "5", isCorrect: true },
      { text: "6", isCorrect: false },
      { text: "16", isCorrect: false },
    ],
  },
  {
    text: "What is √(49) + √(16)?",
    difficulty: "EASY",
    explanation: "7 + 4 = 11.",
    options: [
      { text: "9", isCorrect: false },
      { text: "11", isCorrect: true },
      { text: "13", isCorrect: false },
      { text: "65", isCorrect: false },
    ],
  },
  {
    text: "What is the discriminant of x² − 4x + 3?",
    difficulty: "HARD",
    explanation: "b² − 4ac = 16 − 12 = 4.",
    options: [
      { text: "4", isCorrect: true },
      { text: "12", isCorrect: false },
      { text: "16", isCorrect: false },
      { text: "28", isCorrect: false },
    ],
  },
  {
    text: "If f(x) = x² − 2x, what is f(4)?",
    difficulty: "EASY",
    explanation: "f(4) = 16 − 8 = 8.",
    options: [
      { text: "6", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "10", isCorrect: false },
      { text: "14", isCorrect: false },
    ],
  },
  {
    text: "If h(x) = (x − 1)², what is h(−2)?",
    difficulty: "MEDIUM",
    explanation: "(−2 − 1)² = (−3)² = 9.",
    options: [
      { text: "1", isCorrect: false },
      { text: "3", isCorrect: false },
      { text: "6", isCorrect: false },
      { text: "9", isCorrect: true },
    ],
  },
  {
    text: "What is the sum of the roots of x² − 10x + 21 = 0?",
    difficulty: "HARD",
    explanation: "For ax² + bx + c = 0, sum of roots = −b/a = 10.",
    options: [
      { text: "−10", isCorrect: false },
      { text: "7", isCorrect: false },
      { text: "10", isCorrect: true },
      { text: "21", isCorrect: false },
    ],
  },
  {
    text: "What is the product of the roots of x² − 6x + 8 = 0?",
    difficulty: "HARD",
    explanation: "Product = c/a = 8.",
    options: [
      { text: "−6", isCorrect: false },
      { text: "6", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "14", isCorrect: false },
    ],
  },
  {
    text: "Simplify: (x + 2)² − (x − 2)².",
    difficulty: "HARD",
    explanation: "Difference of squares pattern: 4·x·2 = 8x.",
    options: [
      { text: "0", isCorrect: false },
      { text: "4x", isCorrect: false },
      { text: "8x", isCorrect: true },
      { text: "8", isCorrect: false },
    ],
  },
  {
    text: "If a function f has f(x) = 3x + 1, what is f⁻¹(x)?",
    difficulty: "HARD",
    explanation: "Swap and solve: y = 3x + 1 ⇒ x = (y−1)/3 ⇒ f⁻¹(x) = (x − 1)/3.",
    options: [
      { text: "(x − 1)/3", isCorrect: true },
      { text: "(x + 1)/3", isCorrect: false },
      { text: "3x − 1", isCorrect: false },
      { text: "1/(3x + 1)", isCorrect: false },
    ],
  },
  {
    text: "Which is equivalent to x² − 16?",
    difficulty: "EASY",
    explanation: "Difference of squares: (x − 4)(x + 4).",
    options: [
      { text: "(x − 4)(x + 4)", isCorrect: true },
      { text: "(x − 4)²", isCorrect: false },
      { text: "(x + 4)²", isCorrect: false },
      { text: "(x − 8)(x + 8)", isCorrect: false },
    ],
  },
  {
    text: "If x² = 49, what are the possible values of x?",
    difficulty: "EASY",
    explanation: "x = ±7.",
    options: [
      { text: "only 7", isCorrect: false },
      { text: "−7 and 7", isCorrect: true },
      { text: "±49", isCorrect: false },
      { text: "0 and 49", isCorrect: false },
    ],
  },
  {
    text: "Simplify: √50.",
    difficulty: "MEDIUM",
    explanation: "√50 = √(25 · 2) = 5√2.",
    options: [
      { text: "2√5", isCorrect: false },
      { text: "5√2", isCorrect: true },
      { text: "25√2", isCorrect: false },
      { text: "10", isCorrect: false },
    ],
  },
  {
    text: "If f(x) = x² and g(x) = x + 3, what is f(g(2))?",
    difficulty: "HARD",
    explanation: "g(2) = 5. f(5) = 25.",
    options: [
      { text: "7", isCorrect: false },
      { text: "9", isCorrect: false },
      { text: "13", isCorrect: false },
      { text: "25", isCorrect: true },
    ],
  },
  {
    text: "What is the minimum value of y = x² − 6x + 10?",
    difficulty: "HARD",
    explanation: "Complete the square: (x − 3)² + 1 ⇒ minimum is 1.",
    options: [
      { text: "−3", isCorrect: false },
      { text: "0", isCorrect: false },
      { text: "1", isCorrect: true },
      { text: "10", isCorrect: false },
    ],
  },
  {
    text: "If x² + 4x = 12, what are the values of x?",
    difficulty: "HARD",
    explanation: "x² + 4x − 12 = 0 ⇒ (x + 6)(x − 2) = 0 ⇒ x = −6 or 2.",
    options: [
      { text: "−6 and 2", isCorrect: true },
      { text: "−2 and 6", isCorrect: false },
      { text: "−4 and 3", isCorrect: false },
      { text: "−3 and 4", isCorrect: false },
    ],
  },
  {
    text: "Which expression equals 4^3 · 4^2?",
    difficulty: "EASY",
    explanation: "Add exponents: 4^5.",
    options: [
      { text: "4^5", isCorrect: true },
      { text: "4^6", isCorrect: false },
      { text: "16^5", isCorrect: false },
      { text: "8^5", isCorrect: false },
    ],
  },
  {
    text: "What is (x − 5)(x + 5)?",
    difficulty: "EASY",
    explanation: "Difference of squares: x² − 25.",
    options: [
      { text: "x² − 25", isCorrect: true },
      { text: "x² + 25", isCorrect: false },
      { text: "x² + 10x − 25", isCorrect: false },
      { text: "x² − 10x + 25", isCorrect: false },
    ],
  },

  // ---------- PROBLEM-SOLVING / DATA ANALYSIS (ratios, percents, stats, probability) ----------
  {
    text: "What is 20% of 150?",
    difficulty: "EASY",
    explanation: "0.20 × 150 = 30.",
    options: [
      { text: "15", isCorrect: false },
      { text: "25", isCorrect: false },
      { text: "30", isCorrect: true },
      { text: "45", isCorrect: false },
    ],
  },
  {
    text: "A shirt costs $40 and is on sale for 25% off. What is the sale price?",
    difficulty: "EASY",
    explanation: "Discount = 0.25 × 40 = 10. Sale = 40 − 10 = 30.",
    options: [
      { text: "$25", isCorrect: false },
      { text: "$30", isCorrect: true },
      { text: "$35", isCorrect: false },
      { text: "$50", isCorrect: false },
    ],
  },
  {
    text: "If the ratio of boys to girls is 3:4 and there are 12 boys, how many girls are there?",
    difficulty: "EASY",
    explanation: "12/3 = 4, so girls = 4 × 4 = 16.",
    options: [
      { text: "9", isCorrect: false },
      { text: "12", isCorrect: false },
      { text: "16", isCorrect: true },
      { text: "21", isCorrect: false },
    ],
  },
  {
    text: "A number increases from 40 to 50. What is the percent increase?",
    difficulty: "MEDIUM",
    explanation: "(50 − 40)/40 = 10/40 = 25%.",
    options: [
      { text: "10%", isCorrect: false },
      { text: "20%", isCorrect: false },
      { text: "25%", isCorrect: true },
      { text: "40%", isCorrect: false },
    ],
  },
  {
    text: "What is the mean of 3, 7, 10, 12?",
    difficulty: "EASY",
    explanation: "Sum = 32. 32/4 = 8.",
    options: [
      { text: "7", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "9", isCorrect: false },
      { text: "10", isCorrect: false },
    ],
  },
  {
    text: "What is the median of 2, 5, 9, 11, 20?",
    difficulty: "EASY",
    explanation: "Middle value of a sorted 5-element list is the 3rd: 9.",
    options: [
      { text: "5", isCorrect: false },
      { text: "9", isCorrect: true },
      { text: "11", isCorrect: false },
      { text: "47", isCorrect: false },
    ],
  },
  {
    text: "What is the mode of 4, 7, 4, 9, 4, 2?",
    difficulty: "EASY",
    explanation: "4 appears most often.",
    options: [
      { text: "2", isCorrect: false },
      { text: "4", isCorrect: true },
      { text: "5", isCorrect: false },
      { text: "9", isCorrect: false },
    ],
  },
  {
    text: "A jar has 3 red and 5 blue marbles. What is the probability of drawing a red?",
    difficulty: "EASY",
    explanation: "3/(3+5) = 3/8.",
    options: [
      { text: "1/3", isCorrect: false },
      { text: "3/8", isCorrect: true },
      { text: "3/5", isCorrect: false },
      { text: "5/8", isCorrect: false },
    ],
  },
  {
    text: "If 5 out of 20 students are left-handed, what is the probability of picking a left-handed student?",
    difficulty: "EASY",
    explanation: "5/20 = 1/4.",
    options: [
      { text: "1/5", isCorrect: false },
      { text: "1/4", isCorrect: true },
      { text: "1/3", isCorrect: false },
      { text: "1/2", isCorrect: false },
    ],
  },
  {
    text: "A car travels 240 miles in 4 hours. What is its average speed?",
    difficulty: "EASY",
    explanation: "240/4 = 60 mph.",
    options: [
      { text: "40 mph", isCorrect: false },
      { text: "50 mph", isCorrect: false },
      { text: "60 mph", isCorrect: true },
      { text: "80 mph", isCorrect: false },
    ],
  },
  {
    text: "If 12 pencils cost $3, how much do 20 pencils cost?",
    difficulty: "MEDIUM",
    explanation: "Unit price 3/12 = $0.25. 20 × 0.25 = $5.",
    options: [
      { text: "$4", isCorrect: false },
      { text: "$5", isCorrect: true },
      { text: "$6", isCorrect: false },
      { text: "$7", isCorrect: false },
    ],
  },
  {
    text: "A recipe uses 2 cups of flour for 3 servings. How many cups for 9 servings?",
    difficulty: "EASY",
    explanation: "9/3 = 3 times the recipe. 2 × 3 = 6.",
    options: [
      { text: "4", isCorrect: false },
      { text: "5", isCorrect: false },
      { text: "6", isCorrect: true },
      { text: "8", isCorrect: false },
    ],
  },
  {
    text: "Convert 3/4 to a percent.",
    difficulty: "EASY",
    explanation: "3/4 = 0.75 = 75%.",
    options: [
      { text: "25%", isCorrect: false },
      { text: "50%", isCorrect: false },
      { text: "66%", isCorrect: false },
      { text: "75%", isCorrect: true },
    ],
  },
  {
    text: "What is 15% of 200?",
    difficulty: "EASY",
    explanation: "0.15 × 200 = 30.",
    options: [
      { text: "15", isCorrect: false },
      { text: "20", isCorrect: false },
      { text: "30", isCorrect: true },
      { text: "45", isCorrect: false },
    ],
  },
  {
    text: "A number is 30% of 80. What is it?",
    difficulty: "EASY",
    explanation: "0.30 × 80 = 24.",
    options: [
      { text: "18", isCorrect: false },
      { text: "24", isCorrect: true },
      { text: "28", isCorrect: false },
      { text: "40", isCorrect: false },
    ],
  },
  {
    text: "If a price increases by 10% from $50, what is the new price?",
    difficulty: "EASY",
    explanation: "50 × 1.10 = $55.",
    options: [
      { text: "$45", isCorrect: false },
      { text: "$55", isCorrect: true },
      { text: "$60", isCorrect: false },
      { text: "$100", isCorrect: false },
    ],
  },
  {
    text: "The average of 4 numbers is 10. Their sum is:",
    difficulty: "EASY",
    explanation: "Sum = average × count = 10 × 4 = 40.",
    options: [
      { text: "20", isCorrect: false },
      { text: "30", isCorrect: false },
      { text: "40", isCorrect: true },
      { text: "50", isCorrect: false },
    ],
  },
  {
    text: "In a survey of 200 students, 40% prefer math. How many prefer math?",
    difficulty: "EASY",
    explanation: "0.40 × 200 = 80.",
    options: [
      { text: "40", isCorrect: false },
      { text: "60", isCorrect: false },
      { text: "80", isCorrect: true },
      { text: "120", isCorrect: false },
    ],
  },
  {
    text: "A die is rolled once. What is the probability of rolling an even number?",
    difficulty: "EASY",
    explanation: "Even outcomes {2, 4, 6} = 3/6 = 1/2.",
    options: [
      { text: "1/6", isCorrect: false },
      { text: "1/3", isCorrect: false },
      { text: "1/2", isCorrect: true },
      { text: "2/3", isCorrect: false },
    ],
  },
  {
    text: "If x:y = 2:5 and y = 20, what is x?",
    difficulty: "EASY",
    explanation: "20/5 = 4. x = 2 × 4 = 8.",
    options: [
      { text: "4", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "10", isCorrect: false },
      { text: "12", isCorrect: false },
    ],
  },
  {
    text: "A coin is flipped twice. What is the probability of two heads?",
    difficulty: "MEDIUM",
    explanation: "(1/2)(1/2) = 1/4.",
    options: [
      { text: "1/2", isCorrect: false },
      { text: "1/3", isCorrect: false },
      { text: "1/4", isCorrect: true },
      { text: "1/8", isCorrect: false },
    ],
  },
  {
    text: "A data set: 2, 4, 6, 8, 10. What is the range?",
    difficulty: "EASY",
    explanation: "Max − Min = 10 − 2 = 8.",
    options: [
      { text: "6", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "10", isCorrect: false },
      { text: "30", isCorrect: false },
    ],
  },
  {
    text: "If 3 apples cost $1.50, how much do 10 apples cost?",
    difficulty: "MEDIUM",
    explanation: "Unit 1.50/3 = $0.50. 10 × 0.50 = $5.",
    options: [
      { text: "$3", isCorrect: false },
      { text: "$4", isCorrect: false },
      { text: "$5", isCorrect: true },
      { text: "$6", isCorrect: false },
    ],
  },
  {
    text: "What is the probability of rolling a number greater than 4 on a standard die?",
    difficulty: "MEDIUM",
    explanation: "Favorable {5, 6} = 2/6 = 1/3.",
    options: [
      { text: "1/6", isCorrect: false },
      { text: "1/3", isCorrect: true },
      { text: "1/2", isCorrect: false },
      { text: "2/3", isCorrect: false },
    ],
  },
  {
    text: "The mean of 5 numbers is 20. The mean of 4 of them is 18. What is the fifth?",
    difficulty: "HARD",
    explanation: "Sum of 5 = 100; sum of 4 = 72; fifth = 28.",
    options: [
      { text: "22", isCorrect: false },
      { text: "26", isCorrect: false },
      { text: "28", isCorrect: true },
      { text: "32", isCorrect: false },
    ],
  },

  // ---------- GEOMETRY / TRIG ----------
  {
    text: "A triangle has angles 40° and 75°. What is the third angle?",
    difficulty: "EASY",
    explanation: "180 − (40 + 75) = 65°.",
    options: [
      { text: "55°", isCorrect: false },
      { text: "65°", isCorrect: true },
      { text: "75°", isCorrect: false },
      { text: "115°", isCorrect: false },
    ],
  },
  {
    text: "A rectangle has length 8 and width 5. What is its area?",
    difficulty: "EASY",
    explanation: "8 × 5 = 40.",
    options: [
      { text: "13", isCorrect: false },
      { text: "26", isCorrect: false },
      { text: "40", isCorrect: true },
      { text: "80", isCorrect: false },
    ],
  },
  {
    text: "What is the perimeter of a square with side 7?",
    difficulty: "EASY",
    explanation: "4 × 7 = 28.",
    options: [
      { text: "14", isCorrect: false },
      { text: "21", isCorrect: false },
      { text: "28", isCorrect: true },
      { text: "49", isCorrect: false },
    ],
  },
  {
    text: "A circle has radius 4. What is its area in terms of π?",
    difficulty: "EASY",
    explanation: "πr² = 16π.",
    options: [
      { text: "4π", isCorrect: false },
      { text: "8π", isCorrect: false },
      { text: "12π", isCorrect: false },
      { text: "16π", isCorrect: true },
    ],
  },
  {
    text: "A circle has diameter 10. What is its circumference in terms of π?",
    difficulty: "EASY",
    explanation: "C = πd = 10π.",
    options: [
      { text: "5π", isCorrect: false },
      { text: "10π", isCorrect: true },
      { text: "20π", isCorrect: false },
      { text: "25π", isCorrect: false },
    ],
  },
  {
    text: "A right triangle has legs 3 and 4. What is the hypotenuse?",
    difficulty: "EASY",
    explanation: "√(9 + 16) = √25 = 5.",
    options: [
      { text: "5", isCorrect: true },
      { text: "6", isCorrect: false },
      { text: "7", isCorrect: false },
      { text: "12", isCorrect: false },
    ],
  },
  {
    text: "A right triangle has legs 5 and 12. What is the hypotenuse?",
    difficulty: "MEDIUM",
    explanation: "√(25 + 144) = √169 = 13.",
    options: [
      { text: "11", isCorrect: false },
      { text: "12", isCorrect: false },
      { text: "13", isCorrect: true },
      { text: "17", isCorrect: false },
    ],
  },
  {
    text: "What is the area of a triangle with base 10 and height 6?",
    difficulty: "EASY",
    explanation: "(1/2)(10)(6) = 30.",
    options: [
      { text: "16", isCorrect: false },
      { text: "30", isCorrect: true },
      { text: "60", isCorrect: false },
      { text: "120", isCorrect: false },
    ],
  },
  {
    text: "In a right triangle, sin(30°) = ?",
    difficulty: "MEDIUM",
    explanation: "sin(30°) = 1/2.",
    options: [
      { text: "1/3", isCorrect: false },
      { text: "1/2", isCorrect: true },
      { text: "√2/2", isCorrect: false },
      { text: "√3/2", isCorrect: false },
    ],
  },
  {
    text: "cos(60°) = ?",
    difficulty: "MEDIUM",
    explanation: "cos(60°) = 1/2.",
    options: [
      { text: "0", isCorrect: false },
      { text: "1/2", isCorrect: true },
      { text: "√3/2", isCorrect: false },
      { text: "1", isCorrect: false },
    ],
  },
  {
    text: "A rectangular prism has dimensions 2 × 3 × 4. What is its volume?",
    difficulty: "EASY",
    explanation: "2 × 3 × 4 = 24.",
    options: [
      { text: "9", isCorrect: false },
      { text: "18", isCorrect: false },
      { text: "24", isCorrect: true },
      { text: "36", isCorrect: false },
    ],
  },
  {
    text: "The volume of a cube with side 5 is:",
    difficulty: "EASY",
    explanation: "5³ = 125.",
    options: [
      { text: "15", isCorrect: false },
      { text: "25", isCorrect: false },
      { text: "75", isCorrect: false },
      { text: "125", isCorrect: true },
    ],
  },
  {
    text: "Two angles of a triangle are 50° and 60°. What type of triangle?",
    difficulty: "MEDIUM",
    explanation: "Third angle is 70°. All different, all acute: acute scalene.",
    options: [
      { text: "Right", isCorrect: false },
      { text: "Obtuse", isCorrect: false },
      { text: "Acute", isCorrect: true },
      { text: "Equilateral", isCorrect: false },
    ],
  },
  {
    text: "A circle has radius 3. What is its circumference in terms of π?",
    difficulty: "EASY",
    explanation: "2πr = 6π.",
    options: [
      { text: "3π", isCorrect: false },
      { text: "6π", isCorrect: true },
      { text: "9π", isCorrect: false },
      { text: "12π", isCorrect: false },
    ],
  },
  {
    text: "A square has area 81. What is the length of one side?",
    difficulty: "EASY",
    explanation: "√81 = 9.",
    options: [
      { text: "7", isCorrect: false },
      { text: "8", isCorrect: false },
      { text: "9", isCorrect: true },
      { text: "10", isCorrect: false },
    ],
  },
  {
    text: "In the xy-plane, what is the distance from (0, 0) to (3, 4)?",
    difficulty: "MEDIUM",
    explanation: "√(9 + 16) = 5.",
    options: [
      { text: "5", isCorrect: true },
      { text: "6", isCorrect: false },
      { text: "7", isCorrect: false },
      { text: "12", isCorrect: false },
    ],
  },
  {
    text: "A central angle of 90° intercepts an arc of what fraction of the circle?",
    difficulty: "MEDIUM",
    explanation: "90/360 = 1/4.",
    options: [
      { text: "1/6", isCorrect: false },
      { text: "1/4", isCorrect: true },
      { text: "1/3", isCorrect: false },
      { text: "1/2", isCorrect: false },
    ],
  },
  {
    text: "A triangle has sides 6, 8, 10. Is it a right triangle?",
    difficulty: "MEDIUM",
    explanation: "6² + 8² = 36 + 64 = 100 = 10². Yes.",
    options: [
      { text: "Yes", isCorrect: true },
      { text: "No", isCorrect: false },
      { text: "Can't tell", isCorrect: false },
      { text: "Only equilateral", isCorrect: false },
    ],
  },
  {
    text: "A cylinder has radius 2 and height 5. What is its volume in terms of π?",
    difficulty: "MEDIUM",
    explanation: "πr²h = π · 4 · 5 = 20π.",
    options: [
      { text: "10π", isCorrect: false },
      { text: "15π", isCorrect: false },
      { text: "20π", isCorrect: true },
      { text: "40π", isCorrect: false },
    ],
  },
  {
    text: "The midpoint of the segment from (1, 2) to (7, 10) is:",
    difficulty: "MEDIUM",
    explanation: "((1+7)/2, (2+10)/2) = (4, 6).",
    options: [
      { text: "(3, 5)", isCorrect: false },
      { text: "(4, 6)", isCorrect: true },
      { text: "(6, 8)", isCorrect: false },
      { text: "(8, 12)", isCorrect: false },
    ],
  },
  {
    text: "tan(45°) = ?",
    difficulty: "MEDIUM",
    explanation: "tan(45°) = 1.",
    options: [
      { text: "0", isCorrect: false },
      { text: "1/2", isCorrect: false },
      { text: "1", isCorrect: true },
      { text: "√3", isCorrect: false },
    ],
  },
  {
    text: "A circle equation: (x − 2)² + (y + 3)² = 25. What is the radius?",
    difficulty: "HARD",
    explanation: "r² = 25 ⇒ r = 5.",
    options: [
      { text: "3", isCorrect: false },
      { text: "5", isCorrect: true },
      { text: "12.5", isCorrect: false },
      { text: "25", isCorrect: false },
    ],
  },
  {
    text: "A regular hexagon has 6 equal sides of 4. What is its perimeter?",
    difficulty: "EASY",
    explanation: "6 × 4 = 24.",
    options: [
      { text: "12", isCorrect: false },
      { text: "18", isCorrect: false },
      { text: "24", isCorrect: true },
      { text: "30", isCorrect: false },
    ],
  },
  {
    text: "In a right triangle, if one angle is 30° the other (non-right) angle is:",
    difficulty: "EASY",
    explanation: "90 − 30 = 60°.",
    options: [
      { text: "30°", isCorrect: false },
      { text: "45°", isCorrect: false },
      { text: "60°", isCorrect: true },
      { text: "90°", isCorrect: false },
    ],
  },
  {
    text: "Parallel lines cut by a transversal: corresponding angles are:",
    difficulty: "EASY",
    explanation: "Corresponding angles are congruent.",
    options: [
      { text: "Equal", isCorrect: true },
      { text: "Supplementary", isCorrect: false },
      { text: "Complementary", isCorrect: false },
      { text: "Opposite", isCorrect: false },
    ],
  },
];

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  console.log(`Seeding SAT course with ${TOTAL_QUESTIONS} questions…`);
  console.log(`Template pool size: ${TEMPLATES.length}`);

  const existing = await prisma.course.findUnique({ where: { slug: "sat" } });
  if (existing) {
    console.log(`"sat" course already exists (id ${existing.id}). Aborting.`);
    console.log(`To re-seed: DELETE FROM "Course" WHERE slug = 'sat';`);
    return;
  }

  const course = await prisma.course.create({
    data: {
      title: "SAT",
      slug: "sat",
      description:
        "Official-style SAT practice across Math and (coming soon) Reading & Writing.",
      isPublished: true,
      order: 0,
    },
  });
  console.log(`✓ Course created: ${course.id}`);

  const topic = await prisma.topic.create({
    data: {
      courseId: course.id,
      title: "Math",
      slug: "math",
      description:
        "1000 SAT Math practice questions covering algebra, advanced math, data analysis, and geometry.",
      isPublished: true,
      order: 0,
    },
  });
  console.log(`✓ Topic created: ${topic.id}`);

  // Generate 1000 shuffled indices into the template pool, numbered uniquely.
  const indices = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    indices.push(i % TEMPLATES.length);
  }
  const shuffled = shuffle(indices);

  console.log(`Inserting ${TOTAL_QUESTIONS} questions…`);
  const started = Date.now();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    const tpl = TEMPLATES[shuffled[i]];
    await prisma.question.create({
      data: {
        topicId: topic.id,
        text: `Q${i + 1}. ${tpl.text}`,
        explanation: tpl.explanation,
        difficulty: tpl.difficulty,
        order: i,
        options: {
          create: tpl.options.map((o, idx) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            order: idx,
          })),
        },
      },
    });

    if ((i + 1) % 100 === 0) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`  ${i + 1}/${TOTAL_QUESTIONS} (${elapsed}s)`);
    }
  }

  const total = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n✓ Done. Inserted ${TOTAL_QUESTIONS} questions in ${total}s.`);
  console.log(`  Course: /courses/sat`);
  console.log(`  Topic:  /courses/sat/math`);
  console.log(`  Admin:  /admin/courses/${course.id}/topics/${topic.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
