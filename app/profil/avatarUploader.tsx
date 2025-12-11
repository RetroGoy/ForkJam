"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";

export default function AvatarUploader({ user, onUpload }: any) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: any) {
    try {
      setUploading(true);

      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}.${fileExt}`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Retrieve public (signed) URL
      const { data: urlData } = await supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Save in DB
      await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      onUpload(avatarUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="cursor-pointer text-yellow-400 underline text-sm">
        Change Avatar
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}