import React from "react";

export default function UserHeader({ profile, onEdit }: any) {
  if (!profile) {
    return (
      <div className="text-gray-500">
        Loading profile...
      </div>
    );
  }

  const memberSince = new Date(profile.created_at);
  const now = new Date();

  const diffMonths =
    (now.getFullYear() - memberSince.getFullYear()) * 12 +
    now.getMonth() - memberSince.getMonth();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-yellow-900/30 flex justify-between">
      <div>
        <h1 className="text-2xl font-bold text-yellow-400">
          {profile.username}
        </h1>
        <p className="text-gray-300">{profile.email}</p>

        <p className="text-gray-500 mt-2">
          Member since {diffMonths >= 12
            ? `${Math.floor(diffMonths / 12)} years`
            : `${diffMonths} months`}
        </p>

        <p className="text-gray-400 mt-1">
          Department: {profile.department ?? "Not specified"}
        </p>
      </div>

      <button
        onClick={onEdit}
        className="self-start bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400"
      >
        Modify
      </button>
    </div>
  );
}