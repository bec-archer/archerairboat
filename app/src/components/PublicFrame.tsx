export default function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <div className="mb-6 text-center">
        <div className="text-3xl">🛥️</div>
        <div className="text-lg font-bold text-marsh-900">Archer Airboat Tours</div>
        <div className="text-sm text-marsh-600">Matlacha, Florida</div>
      </div>
      {children}
    </div>
  );
}
