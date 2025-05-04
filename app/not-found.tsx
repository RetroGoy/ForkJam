import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <h1 className="text-6xl font-bold text-primary tracking-widest">
          DRUIDE 404
        </h1>
      </div>
            
      <h2 className="text-3xl font-bold text-white mb-2">NOT FOUND</h2>
      <p className="text-gray-400 mb-8">
        The topic you are looking for seems to have disappeared into the ether.
      </p>
      
      <Link href="/">
        <button className="px-6 py-3 bg-yellow-700 hover:bg-primary text-white rounded-md transition-colors">
          Return to Main Page
        </button>
      </Link>
    </div>
  );
}