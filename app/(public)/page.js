import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSubscription, daysRemaining } from "@/lib/subscription";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, Lock } from "lucide-react";

// Per-request — subscription status varies by user.
export const dynamic = "force-dynamic";

async function getCourses() {
  return prisma.course.findMany({
    where: { isPublished: true },
    include: { _count: { select: { topics: true } } },
    orderBy: { order: "asc" },
  });
}

export default async function HomePage() {
  const [courses, session] = await Promise.all([getCourses(), auth()]);
  const isAdmin = session?.user?.role === "admin";
  const userId = session?.user?.id;
  const sub = !isAdmin && userId ? await getSubscription(userId) : null;
  const hasAccess = isAdmin || (sub && sub.expiresAt > new Date());
  const daysLeft = sub ? daysRemaining(sub.expiresAt) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white mb-3">
          Master Your Subjects
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Practice with targeted multiple-choice questions. Track your performance.
          See where you stand.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
          {hasAccess ? (
            <Badge className="bg-emerald-900 text-emerald-300 text-sm px-3 py-1">
              {isAdmin
                ? "Admin access"
                : `Subscribed · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
            </Badge>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              View subscription plans
            </Link>
          )}
        </div>
      </div>

      {/* Courses grid */}
      {courses.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p>No courses available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`}>
              <div className="bg-[#243447] border border-slate-700 rounded-lg p-6 hover:border-blue-500 hover:bg-[#2a3d55] transition-all group cursor-pointer h-full">
                {course.imageUrl && (
                  <div className="relative w-full h-32 mb-4 rounded overflow-hidden opacity-80">
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <h2 className="text-white font-semibold text-lg leading-snug group-hover:text-blue-300 transition-colors">
                    {course.title}
                  </h2>
                  <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                </div>
                {course.description && (
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-slate-300 text-xs"
                  >
                    {course._count.topics} topic
                    {course._count.topics !== 1 ? "s" : ""}
                  </Badge>
                  {!hasAccess && (
                    <Badge className="bg-slate-800 text-slate-400 text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Subscription
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
