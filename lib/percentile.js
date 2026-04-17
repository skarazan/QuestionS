import { unstable_cache } from "next/cache";
import prisma from "./prisma";

/**
 * Topic percentile: % of completed attempts with score <= given score.
 * SQL aggregate — O(1) roundtrip. Cached 5 min per (topicId, score).
 */
async function computeTopicPercentile(topicId, score) {
  const rows = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "scorePercentage" <= ${score})::int AS below
    FROM "QuizAttempt"
    WHERE "topicId" = ${topicId}
      AND "completedAt" IS NOT NULL
  `;
  const { total, below } = rows[0] ?? { total: 0, below: 0 };
  if (!total) return null;
  return Math.round((below / total) * 100);
}

export const getTopicPercentile = unstable_cache(
  async (topicId, score) => computeTopicPercentile(topicId, score),
  ["topic-percentile"],
  { revalidate: 300, tags: ["percentile"] }
);

/**
 * Course percentile: user's avg across topics vs all users' avgs.
 * Single grouped SQL query. Cached 5 min per (courseId, userId).
 */
async function computeCoursePercentile(courseId, userId) {
  const rows = await prisma.$queryRaw`
    WITH user_avgs AS (
      SELECT
        qa."userId" AS uid,
        AVG(COALESCE(qa."scorePercentage", 0))::float AS avg_score
      FROM "QuizAttempt" qa
      INNER JOIN "Topic" t ON t.id = qa."topicId"
      WHERE t."courseId" = ${courseId}
        AND qa."completedAt" IS NOT NULL
      GROUP BY qa."userId"
    ),
    me AS (
      SELECT avg_score FROM user_avgs WHERE uid = ${userId}
    )
    SELECT
      (SELECT COUNT(*)::int FROM user_avgs) AS total,
      (SELECT COUNT(*)::int FROM user_avgs WHERE avg_score <= (SELECT avg_score FROM me)) AS below,
      (SELECT avg_score FROM me) AS my_avg
  `;
  const { total, below, my_avg } = rows[0] ?? {};
  if (!total || my_avg == null) return null;
  return Math.round((below / total) * 100);
}

export const getCoursePercentile = unstable_cache(
  async (courseId, userId) => computeCoursePercentile(courseId, userId),
  ["course-percentile"],
  { revalidate: 300, tags: ["percentile"] }
);
