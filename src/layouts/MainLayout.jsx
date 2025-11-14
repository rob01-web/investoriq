import InvestorIQHeader from "@/components/InvestorIQHeader";

export default function MainLayout({ children }) {
  return (
    <>
      <InvestorIQHeader />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}
