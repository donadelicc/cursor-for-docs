export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">JUVO Docs</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a
              href="#features"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
