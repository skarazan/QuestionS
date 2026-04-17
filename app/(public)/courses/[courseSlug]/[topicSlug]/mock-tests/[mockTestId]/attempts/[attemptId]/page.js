import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import MockAttemptContainer from "@/components/mock/MockAttemptContainer";

export default async function MockAttemptPage({ params }) {
  const { courseSlug, topicSlug, mockTestId, attemptId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=/courses/${courseSlug}/${topicSlug}/mock-tests/${mockTestId}/attempts/${attemptId}`
    );
  }

  // Verify attempt exists + belongs to user + belongs to specified mock test path
  const attempt = await prisma.mockAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      mockTestId: true,
      mockTest: {
        select: {
          id: true,
          topic: {
            select: {
              slug: true,
              course: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  if (
    !attempt ||
    attempt.userId !== session.user.id ||
    attempt.mockTestId !== mockTestId ||
    attempt.mockTest.topic.slug !== topicSlug ||
    attempt.mockTest.topic.course.slug !== courseSlug
  ) {
    notFound();
  }

  return (
    <MockAttemptContainer
      attemptId={attemptId}
      courseSlug={courseSlug}
      topicSlug={topicSlug}
      mockTestId={mockTestId}
    />
  );
}
