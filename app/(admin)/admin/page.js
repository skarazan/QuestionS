import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookOpen, FileQuestion, Users, TrendingUp } from "lucide-react";

async function getStats() {
  const [courses, topics, questions, users, attempts] = await Promise.all([
    prisma.course.count(),
    prisma.topic.count(),
    prisma.question.count(),
    prisma.user.count(),
    prisma.quizAttempt.count({ where: { completedAt: { not: null } } }),
  ]);
  return { courses, topics, questions, users, attempts };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Courses", value: stats.courses, icon: BookOpen, href: "/admin/courses", color: "text-blue-400" },
    { label: "Topics", value: stats.topics, icon: BookOpen, href: "/admin/courses", color: "text-purple-400" },
    { label: "Questions", value: stats.questions, icon: FileQuestion, href: "/admin/courses", color: "text-amber-400" },
    { label: "Students", value: stats.users, icon: Users, href: "#", color: "text-emerald-400" },
    { label: "Attempts", value: stats.attempts, icon: TrendingUp, href: "#", color: "text-pink-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-5 hover:border-slate-500 transition-colors">
              <card.icon className={`h-6 w-6 ${card.color} mb-3`} />
              <p className="text-slate-400 text-xs">{card.label}</p>
              <p className="text-white text-3xl font-bold mt-1">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/courses/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            + New Course
          </Link>
          <Link
            href="/admin/courses"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
          >
            Manage Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
