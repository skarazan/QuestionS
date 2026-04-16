import Navbar from "@/components/layout/Navbar";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#1a2332] flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
