import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <h1 className="text-6xl font-bold text-yellow-500 tracking-widest">
          DRUIDE 500
        </h1>
        <div className="absolute -bottom-4 left-0 right-0 text-lg text-yellow-300">
          SIGNAL LOST
        </div>
      </div>
      
      <div className="w-16 h-16 mb-6 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      
      <h2 className="text-3xl font-bold text-white mb-2">404 - Node Not Found</h2>
      <p className="text-gray-400 max-w-md mb-8">
        The audio node you're looking for seems to have disappeared into the ether.
      </p>
      
      <Link href="/">
        <button className="px-6 py-3 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md transition-colors">
          Return to Base Station
        </button>
      </Link>
    </div>
  );
}