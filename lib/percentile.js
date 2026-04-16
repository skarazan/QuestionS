import prisma from "./prisma";

/**
 * Returns percentile rank for a topic quiz score.
 * Percentile = % of all completed attempts on this topic with score <= given score.
 */
export async function getTopicPercentile(topicId, score) {
  const allAttempts = await prisma.quizAttempt.findMany({
    where: { topicId, completedAt: { not: null } },
    select: { scorePercentage: true },
  });

  if (allAttempts.length === 0) return null;

  const below = allAttempts.filter((a) => a.scorePercentage <= score).length;
  return Math.round((below / allAttempts.length) * 100);
}

/**
 * Returns course-level percentile for a user.
 * Compares user's average score across all topics in the course
 * against all other users' averages in the same course.
 */
export async function getCoursePercentile(courseId, userId) {
  // Get all topics in this course
  const topics = await prisma.topic.findMany({
    where: { courseId },
    select: { id: true },
  });
  const topicIds = topics.map((t) => t.id);

  if (topicIds.length === 0) return null;

  // Get all completed attempts for these topics
  const allAttempts = await prisma.quizAttempt.findMany({
    where: {
      topicId: { in: topicIds },
      completedAt: { not: null },
    },
    select: { userId: true, scorePercentage: true },
  });

  if (allAttempts.length === 0) return null;

  // Group by user: compute each user's average score across topics
  const userScores = {};
  for (const attempt of allAttempts) {
    if (!userScores[attempt.userId]) userScores[attempt.userId] = [];
    userScores[attempt.userId].push(attempt.scorePercentage ?? 0);
  }

  const userAverages = Object.entries(userScores).map(([uid, scores]) => ({
    userId: uid,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const currentUserEntry = userAverages.find((u) => u.userId === userId);
  if (!currentUserEntry) return null;

  const currentAvg = currentUserEntry.avg;
  const below = userAverages.filter((u) => u.avg <= currentAvg).length;
  return Math.round((below / userAverages.length) * 100);
}
