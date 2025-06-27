import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/supabaseClient";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { UploadCloud, CheckCircle, Circle, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css"; // modal styles

interface User {
  id: string;
  full_name: string;
  email: string;
  instagram: string | null;
  nickname: string;
  profile_picture_url: string | null;
  bio: string | null;
  show_public_profile: boolean;
  show_profile_to_iconics: boolean;
  date_of_birth: string | null;
  phone_number: string | null;
}

interface UserPhoto {
  id: string;
  url: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneCode, setPhoneCode] = useState("1");
  const [phoneNumber, setPhoneNumber] = useState("");

  // ────────────────────────────────────────────────────────────
  // Fetch profile on mount
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data } = await api.get<User>("/api/users/me");
        if (data.date_of_birth)
          data.date_of_birth = data.date_of_birth.split("T")[0];

        if (data.phone_number) {
          const digits = data.phone_number.replace(/\D/g, "");
          const code =
            digits.length > 11 ? digits.slice(0, digits.length - 11) : "1";
          setPhoneCode(code);
          setPhoneNumber(digits.slice(-11));
        }
        setUser(data);

        const photosRes = await api.get<UserPhoto[]>("/api/user-photos");
        setPhotos(photosRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // ────────────────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!user) return;
    const { name, value, type, checked } = e.target;
    setUser({ ...user, [name]: type === "checkbox" ? checked : value } as User);
  };

  const handleSave = async () => {
    if (!user) return;

    // monta DTO só com campos realmente preenchidos
    const dto: Record<string, any> = {
      show_public_profile: user.show_public_profile,
      show_profile_to_iconics: user.show_profile_to_iconics,
    };

    const addIfValue = (key: keyof User, value?: string | null) => {
      const trimmed = value?.trim();
      if (trimmed) dto[key] = trimmed;
    };

    addIfValue("full_name", user.full_name);
    addIfValue("nickname", user.nickname);
    addIfValue("instagram", user.instagram);
    addIfValue("bio", user.bio);

    if (user.date_of_birth)
      dto.date_of_birth = new Date(user.date_of_birth).toISOString();

    if (phoneNumber) dto.phone_number = `+${phoneCode}${phoneNumber}`;

    try {
      await api.patch("/api/users/me", dto); // nova rota
      toast.success("Profile updated!");
    } catch (error: any) {
      console.error(error);
      toast.error(
        `Update failed: ${error.response?.data?.message || error.message}`
      );
    }
  };

  // ────────────────────────────────────────────────────────────
  // Helper: validate that we have a real renderable image
  // ────────────────────────────────────────────────────────────
  const validateImage = (file: File): Promise<void> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });

  // ────────────────────────────────────────────────────────────
  // Photo upload handler
  // ────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isProfile = false
  ) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];

    // 1) File-type validation
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Unsupported image format. Use JPEG, PNG, WEBP or GIF.");
      return;
    }

    // 2) Corruption / broken file validation
    try {
      await validateImage(file);
    } catch {
      toast.error("The image appears to be corrupted or unreadable.");
      return;
    }

    // 3) Normal upload flow
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const path = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("user-photos")
      .upload(path, file);
    if (error) {
      toast.error("Image upload failed.");
      return;
    }

    try {
      const url = supabase.storage.from("user-photos").getPublicUrl(path)
        .data.publicUrl;

      if (isProfile) {
        await api.patch("/api/users/profile-picture", { url });
        setUser((u) => u && { ...u, profile_picture_url: url });
        toast.success("Profile picture updated!");
      } else {
        await api.post("/api/user-photos", { url, position: photos.length + 1 });
        const photosRes = await api.get<UserPhoto[]>("/api/user-photos");
        setPhotos(photosRes.data);
        toast.success("Photo added!");
      }
    } catch {
      toast.error("Server error while saving image.");
    }
  };

  const handlePhotoDelete = (id: string) => {
    confirmAlert({
      title: "Delete photo",
      message: "Are you sure you want to delete this photo?",
      buttons: [
        {
          label: "Yes, delete",
          onClick: async () => {
            try {
              await api.delete(`/api/user-photos/${id}`);
              setPhotos((p) => p.filter((x) => x.id !== id));
              toast.success("Photo removed.");
            } catch {
              toast.error("Failed to delete photo.");
            }
          },
        },
        {
          label: "Cancel",
          onClick: () => {},
        },
      ],
    });
  };

  // ────────────────────────────────────────────────────────────
  if (loading || !user) return <p className="p-4">Loading profile…</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-16 pb-24">
      <ToastContainer position="top-right" autoClose={4000} />
      <Header />

      <main className="flex-1 overflow-auto p-4 md:p-8 lg:px-16 lg:py-12 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
          My Profile
        </h1>

        {/* Avatar + Form */}
        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <img
                src={user.profile_picture_url || "/avatar_placeholder.png"}
                alt="Avatar"
                className="w-full h-full rounded-xl object-cover bg-gray-200"
                onError={(e) =>
                  (e.currentTarget.src = "/avatar_placeholder.png")
                }
              />
              <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer">
                <UploadCloud className="w-6 h-6 text-black" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handlePhotoUpload(e, true)}
                />
              </label>
            </div>
            <span className="mt-2 text-sm text-gray-600">
              Tap icon to change
            </span>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-4">
            {[
              {
                label: "Full name",
                name: "full_name",
                value: user.full_name,
                placeholder: "John Doe",
              },
              {
                label: "Nickname",
                name: "nickname",
                value: user.nickname,
                placeholder: "johnny",
              },
              {
                label: "Instagram",
                name: "instagram",
                value: user.instagram || "",
                placeholder: "@yourhandle",
              },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {f.label}
                </label>
                <input
                  name={f.name}
                  placeholder={f.placeholder}
                  value={f.value}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-white outline-none text-gray-900"
                />
              </div>
            ))}

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone number
              </label>
              <div className="flex gap-2">
                <input
                  value={phoneCode}
                  onChange={(e) =>
                    setPhoneCode(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={4}
                  className="w-20 p-3 rounded-xl bg-gray-100 text-gray-900 text-center outline-none"
                />
                <input
                  placeholder="11999999999"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 11)
                    )
                  }
                  maxLength={11}
                  inputMode="numeric"
                  className="flex-1 p-3 rounded-xl bg-white text-gray-900 outline-none"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                placeholder="Tell us something about you…"
                value={user.bio || ""}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-white text-gray-900 outline-none"
                rows={3}
              />
            </div>

            {/* Date of birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date of birth
              </label>
              <input
                name="date_of_birth"
                type="date"
                value={user.date_of_birth || ""}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-white text-gray-900 outline-none"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col md:flex-row md:gap-4 mt-4">
              <button
                onClick={() =>
                  setUser(
                    (u) =>
                      u && { ...u, show_public_profile: !u.show_public_profile }
                  )
                }
                className="flex items-center gap-2 text-sm font-medium text-gray-800"
              >
                {user.show_public_profile ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                Show profile publicly
              </button>

              <button
                onClick={() =>
                  setUser(
                    (u) =>
                      u && {
                        ...u,
                        show_profile_to_iconics: !u.show_profile_to_iconics,
                      }
                  )
                }
                className="flex items-center gap-2 text-sm font-medium text-gray-800"
              >
                {user.show_profile_to_iconics ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                Show in ICONIC network
              </button>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold mt-4"
            >
              Save changes
            </button>
          </div>
        </div>

        {/* Extra photos */}
        <div className="mt-8">
          <h2 className="font-semibold mb-2 text-gray-800">
            My photos ({photos.length}/6)
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative h-32">
                <img
                  src={p.url}
                  alt="User photo"
                  className="w-full h-32 object-cover bg-gray-200 rounded-xl"
                  onError={(e) =>
                    (e.currentTarget.src = "/avatar_placeholder.png")
                  }
                />
                <button
                  onClick={() => handlePhotoDelete(p.id)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {photos.length < 6 && (
              <label className="cursor-pointer flex items-center justify-center border-2 border-dashed rounded-xl h-32 bg-white text-gray-500">
                + Add
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handlePhotoUpload(e)}
                />
              </label>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
