"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth as useClerkAuth, useUser, UserProfile } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Camera, User as UserIcon, Bell, Settings, Trash2 } from "lucide-react";
import { API_CONFIG } from '@/config/constants';

export default function SettingsPage() {
  const { user } = useUser();
  const isInstructor = (user?.publicMetadata?.userType as string) === "instructor";
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Instructor Profile", icon: UserIcon },
    { id: "account", label: "Account", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      <MobileDashboardNav isInstructor={isInstructor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                    ${activeTab === tab.id
                      ? "bg-white text-[#F03D3D] shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {activeTab === "profile" && <ProfileSettings user={user} isInstructor={isInstructor} />}
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "notifications" && <NotificationSettings isInstructor={isInstructor} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Clerk User Profile for Account Management
const AccountSettings = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-lg text-gray-900 mb-6">Account Management</h3>
      <p className="text-sm text-gray-500 mb-6">
        Manage your account settings, security, and connected accounts through Clerk.
      </p>
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-0 p-0",
            navbar: "hidden",
            pageScrollBox: "p-0",
            profileSection: "border border-gray-100 rounded-xl p-4 mb-4",
            profileSectionTitle: "text-gray-900 font-bold",
            profileSectionContent: "text-gray-600",
            formButtonPrimary: "bg-[#F03D3D] hover:bg-[#d93636]",
            formFieldInput: "rounded-lg border-gray-300 focus:ring-[#F03D3D] focus:border-[#F03D3D]",
          },
        }}
      />
    </div>
  );
};

// Define user type for ProfileSettings
type ClerkUser = ReturnType<typeof useUser>["user"];

const ProfileSettings = ({ user, isInstructor }: { user: ClerkUser; isInstructor: boolean }) => {
  const { getToken } = useClerkAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssetLoading, setIsAssetLoading] = useState(false);
  const [isAssetUploading, setIsAssetUploading] = useState(false);
  const [instructorPost, setInstructorPost] = useState<InstructorPost | null>(null);
  const [formData, setFormData] = useState<InstructorProfileForm>(emptyInstructorForm);
  const [vehiclePhotos, setVehiclePhotos] = useState<InstructorAsset[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOtherLanguages, setShowOtherLanguages] = useState(false);

  const isEditable = Boolean(instructorPost?.is_approved);
  const showNotInstructorMessage = !isLoading && (!instructorPost || !instructorPost.is_approved);
  const transmission = normalizeTransmission(instructorPost?.transmission);
  const isAutomaticTransmission = transmission === "automatic" || transmission === "auto";
  const isManualTransmission = transmission === "manual";
  const showAutomaticPrices = !transmission || isAutomaticTransmission;
  const showManualPrices = !transmission || isManualTransmission;

  useEffect(() => {
    let isMounted = true;

    const loadInstructorPost = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          if (isMounted) {
            setInstructorPost(null);
            setFormData(emptyInstructorForm);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load instructor profile");
        }

        const data: InstructorPost = await response.json();
        if (isMounted) {
          setInstructorPost(data);
          setFormData(mapPostToForm(data));
        }
      } catch (_error) {
        if (isMounted) {
          setInstructorPost(null);
          setFormData(emptyInstructorForm);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInstructorPost();

    return () => {
      isMounted = false;
    };
  }, [getToken, user]);

  useEffect(() => {
    let isMounted = true;

    const loadAssets = async () => {
      if (!user || !instructorPost) return;
      setIsAssetLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/posts/mine/assets?asset_type=vehicle_photos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load assets");
        }

        const data: InstructorAsset[] = await response.json();
        if (isMounted) {
          setVehiclePhotos(data);
        }
      } catch (_error) {
        if (isMounted) {
          setVehiclePhotos([]);
        }
      } finally {
        if (isMounted) {
          setIsAssetLoading(false);
        }
      }
    };

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, [getToken, instructorPost, user]);

  const handleTextChange = (field: keyof InstructorProfileForm) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLanguageToggle = (code: string) => {
    const current = normalizeLanguageCodes(formData.language_skills);
    const next = current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code];
    setFormData((prev) => ({ ...prev, language_skills: serializeLanguageCodes(next) }));
  };

  const handleNumericChange = (field: keyof InstructorProfileForm) => (value: string) => {
    if (value === "" || /^\d+(\.\d+)?$/.test(value)) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!instructorPost || !isEditable) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      const payload = buildUpdatePayload(formData);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${instructorPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save instructor profile");
      }

      const updated: InstructorPost = await response.json();
      setInstructorPost(updated);
      setFormData(mapPostToForm(updated));
      setSuccessMessage("Profile updated successfully");
    } catch (_error) {
      // Silent fail to preserve UI behavior
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!instructorPost) return;
    setFormData(mapPostToForm(instructorPost));
    setSuccessMessage(null);
  };

  const handleUploadVehiclePhotos = async (files: FileList | null) => {
    if (!files || !isEditable) return;
    setIsAssetUploading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = new FormData();
      data.append("asset_type", "vehicle_photos");
      Array.from(files).forEach((file) => data.append("files", file));

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error("Failed to upload vehicle photos");
      }

      const uploaded: InstructorAsset[] = await response.json();
      setVehiclePhotos((prev) => [...uploaded, ...prev]);
      setSuccessMessage("Vehicle photos updated successfully");
    } catch (_error) {
      // Silent fail to preserve UI behavior
    } finally {
      setIsAssetUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveVehiclePhoto = async (assetId: string) => {
    if (!isEditable) return;
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets/${assetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove photo");
      }

      setVehiclePhotos((prev) => prev.filter((asset) => asset.id !== assetId));
      setSuccessMessage("Vehicle photo removed successfully");
    } catch (_error) {
      // Silent fail to preserve UI behavior
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative group cursor-pointer flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-white shadow-sm overflow-hidden">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.firstName?.[0] || (isInstructor ? "I" : "U")
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-lg text-gray-900">Profile Photo</h3>
          <p className="text-sm text-gray-500 mb-3">Manage your photo in Account settings.</p>
          <div className="flex gap-3 justify-center sm:justify-start">
            <Button size="sm" variant="outline" onClick={() => document.querySelector<HTMLButtonElement>('[data-tab="account"]')?.click()}>
              Update in Account
            </Button>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-gray-900 mb-2">Availability</h3>
        <p className="text-sm text-gray-500 mb-4">
          Set your availability using the responsive calendar.
        </p>
        <Button asChild>
          <Link href="/dashboard/schedule">Open Calendar</Link>
        </Button>
      </div>

      {/* Personal Info Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-gray-900 mb-6">Personal Information</h3>
        {showNotInstructorMessage && (
          <p className="text-sm text-gray-500 mb-6">You are not an instructor yet</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Title"
            value={formData.title}
            onChange={(e) => handleTextChange("title")(e.target.value)}
            disabled={!isEditable}
          />
          <InputField
            label="Located At"
            value={formData.located_at}
            onChange={(e) => handleTextChange("located_at")(e.target.value)}
            disabled={!isEditable}
          />
          <InputField
            label="Google Maps URL"
            value={formData.google_maps_url}
            onChange={(e) => handleTextChange("google_maps_url")(e.target.value)}
            disabled={!isEditable}
          />
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">Language Skills</label>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_LANGUAGE_OPTIONS.map((option) => {
                const selected = normalizeLanguageCodes(formData.language_skills).includes(option.code);
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleLanguageToggle(option.code)}
                    disabled={!isEditable}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${selected
                        ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5"
                        : "border-gray-200 text-gray-700 bg-white"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {option.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowOtherLanguages((prev) => !prev)}
                disabled={!isEditable}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${showOtherLanguages
                    ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5"
                    : "border-gray-200 text-gray-700 bg-white"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                Other
              </button>
            </div>
            {showOtherLanguages && (
              <div className="flex flex-wrap gap-2">
                {OTHER_LANGUAGE_OPTIONS.map((option) => {
                  const selected = normalizeLanguageCodes(formData.language_skills).includes(option.code);
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => handleLanguageToggle(option.code)}
                      disabled={!isEditable}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${selected
                          ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5"
                          : "border-gray-200 text-gray-700 bg-white"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Selected: {formatLanguageLabels(formData.language_skills) || "None"}
            </p>
          </div>
          {showAutomaticPrices && (
            <>
              <InputField
                label="Automatic City Price"
                value={formData.automatic_city_price}
                onChange={(e) => handleNumericChange("automatic_city_price")(e.target.value)}
                inputMode="decimal"
                disabled={!isEditable}
              />
              <InputField
                label="Automatic Yard Price"
                value={formData.automatic_yard_price}
                onChange={(e) => handleNumericChange("automatic_yard_price")(e.target.value)}
                inputMode="decimal"
                disabled={!isEditable}
              />
            </>
          )}
          {showManualPrices && (
            <>
              <InputField
                label="Manual City Price"
                value={formData.manual_city_price}
                onChange={(e) => handleNumericChange("manual_city_price")(e.target.value)}
                inputMode="decimal"
                disabled={!isEditable}
              />
              <InputField
                label="Manual Yard Price"
                value={formData.manual_yard_price}
                onChange={(e) => handleNumericChange("manual_yard_price")(e.target.value)}
                inputMode="decimal"
                disabled={!isEditable}
              />
            </>
          )}
          <InputField
            label="Applicant First Name"
            value={formData.applicant_first_name}
            onChange={(e) => handleTextChange("applicant_first_name")(e.target.value)}
            disabled={!isEditable}
          />
          <InputField
            label="Applicant Last Name"
            value={formData.applicant_last_name}
            onChange={(e) => handleTextChange("applicant_last_name")(e.target.value)}
            disabled={!isEditable}
          />
          <InputField
            label="Contact Email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleTextChange("contact_email")(e.target.value)}
            disabled={!isEditable}
          />
          <InputField
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleTextChange("phone")(e.target.value)}
            disabled={!isEditable}
          />
          <InputField
            label="Applicant City"
            value={formData.applicant_city}
            onChange={(e) => handleTextChange("applicant_city")(e.target.value)}
            disabled={!isEditable}
          />
          <InputField
            label="Date of Birth"
            type="date"
            value={formData.applicant_date_of_birth}
            onChange={(e) => handleTextChange("applicant_date_of_birth")(e.target.value)}
            disabled={!isEditable}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm min-h-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
              value={formData.description}
              onChange={(e) => handleTextChange("description")(e.target.value)}
              disabled={!isEditable}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Applicant Address</label>
            <textarea
              className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm min-h-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
              value={formData.applicant_address}
              onChange={(e) => handleTextChange("applicant_address")(e.target.value)}
              disabled={!isEditable}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          To update email, password, or security settings, go to the Account tab.
        </p>
        {successMessage && (
          <p className="text-sm text-green-700 font-semibold mt-4">{successMessage}</p>
        )}
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" disabled={!isEditable || isSaving} onClick={handleDiscard}>
            Discard Changes
          </Button>
          <Button disabled={!isEditable || isSaving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Vehicle Photos */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-gray-900">Vehicle Photos</h3>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(event) => handleUploadVehiclePhotos(event.target.files)}
              disabled={!isEditable}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!isEditable || isAssetUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photos
            </Button>
          </div>
        </div>

        {showNotInstructorMessage && (
          <p className="text-sm text-gray-500 mb-6">You are not an instructor yet</p>
        )}

        {isAssetLoading ? (
          <p className="text-sm text-gray-500">Loading photos...</p>
        ) : vehiclePhotos.length === 0 ? (
          <p className="text-sm text-gray-500">No vehicle photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehiclePhotos.map((photo) => (
              <div key={photo.id} className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <img src={photo.url} alt={photo.original_filename || "Vehicle photo"} className="w-full h-40 object-cover" />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveVehiclePhoto(photo.id)}
                    disabled={!isEditable}
                    className="p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="Remove vehicle photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationSettings = ({ isInstructor }: { isInstructor: boolean }) => {
  const studentNotifications = [
    { title: "Lesson Reminders", desc: "Get notified 24h before your lesson starts" },
    { title: "New Messages", desc: "Receive emails when you get a new message" },
    { title: "Marketing Updates", desc: "Receive news about features and promotions" },
  ];

  const instructorNotifications = [
    { title: "New Bookings", desc: "Get notified when a student books a lesson" },
    { title: "Cancellations", desc: "Get notified when a lesson is cancelled" },
    { title: "New Messages", desc: "Receive emails when you get a new message" },
    { title: "Marketing Updates", desc: "Receive news about features and promotions" },
  ];

  const notifications = isInstructor ? instructorNotifications : studentNotifications;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-lg text-gray-900 mb-6">Notifications</h3>
      <div className="space-y-6">
        {notifications.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
            <div>
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F03D3D]"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputField = ({ label, ...props }: InputFieldProps) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      {...props}
    />
  </div>
);

type InstructorPost = {
  id: string;
  title?: string | null;
  description?: string | null;
  located_at?: string | null;
  google_maps_url?: string | null;
  transmission?: string | null;
  automatic_city_price?: number | null;
  automatic_yard_price?: number | null;
  manual_city_price?: number | null;
  manual_yard_price?: number | null;
  language_skills?: string | null;
  applicant_first_name?: string | null;
  applicant_last_name?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  applicant_city?: string | null;
  applicant_address?: string | null;
  applicant_date_of_birth?: string | null;
  is_approved?: boolean | null;
};

type InstructorAsset = {
  id: string;
  instructor_id: string;
  asset_type: string;
  url: string;
  object_key: string;
  original_filename?: string | null;
  content_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
};

type InstructorProfileForm = {
  title: string;
  description: string;
  located_at: string;
  google_maps_url: string;
  automatic_city_price: string;
  automatic_yard_price: string;
  manual_city_price: string;
  manual_yard_price: string;
  language_skills: string;
  applicant_first_name: string;
  applicant_last_name: string;
  contact_email: string;
  phone: string;
  applicant_city: string;
  applicant_address: string;
  applicant_date_of_birth: string;
};

const emptyInstructorForm: InstructorProfileForm = {
  title: "",
  description: "",
  located_at: "",
  google_maps_url: "",
  automatic_city_price: "",
  automatic_yard_price: "",
  manual_city_price: "",
  manual_yard_price: "",
  language_skills: "",
  applicant_first_name: "",
  applicant_last_name: "",
  contact_email: "",
  phone: "",
  applicant_city: "",
  applicant_address: "",
  applicant_date_of_birth: "",
};

const normalizeNumber = (value?: number | null) => (value === null || value === undefined ? "" : String(value));

const normalizeDate = (value?: string | null) => {
  if (!value) return "";
  return value.split("T")[0];
};

const PRIMARY_LANGUAGE_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "ka", label: "Georgian" },
  { code: "ru", label: "Russian" },
];

const OTHER_LANGUAGE_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
];

const LANGUAGE_LABELS = new Map(
  [...PRIMARY_LANGUAGE_OPTIONS, ...OTHER_LANGUAGE_OPTIONS].map((item) => [item.code, item.label])
);

const normalizeLanguageCodes = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const serializeLanguageCodes = (codes: string[]) =>
  codes.length ? `${codes.join(",")},` : "";

const formatLanguageLabels = (value: string) =>
  normalizeLanguageCodes(value)
    .map((code) => LANGUAGE_LABELS.get(code) || code)
    .join(", ");

const mapPostToForm = (post: InstructorPost): InstructorProfileForm => ({
  title: post.title || "",
  description: post.description || "",
  located_at: post.located_at || "",
  google_maps_url: post.google_maps_url || "",
  automatic_city_price: normalizeNumber(post.automatic_city_price),
  automatic_yard_price: normalizeNumber(post.automatic_yard_price),
  manual_city_price: normalizeNumber(post.manual_city_price),
  manual_yard_price: normalizeNumber(post.manual_yard_price),
  language_skills: post.language_skills || "",
  applicant_first_name: post.applicant_first_name || "",
  applicant_last_name: post.applicant_last_name || "",
  contact_email: post.contact_email || "",
  phone: post.phone || "",
  applicant_city: post.applicant_city || "",
  applicant_address: post.applicant_address || "",
  applicant_date_of_birth: normalizeDate(post.applicant_date_of_birth),
});

const normalizeTransmission = (value?: string | null) => (value || "").trim().toLowerCase();

const toNumber = (value: string) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildUpdatePayload = (form: InstructorProfileForm) => ({
  title: form.title || null,
  description: form.description || null,
  located_at: form.located_at || null,
  google_maps_url: form.google_maps_url || null,
  automatic_city_price: toNumber(form.automatic_city_price),
  automatic_yard_price: toNumber(form.automatic_yard_price),
  manual_city_price: toNumber(form.manual_city_price),
  manual_yard_price: toNumber(form.manual_yard_price),
  language_skills: form.language_skills || null,
  applicant_first_name: form.applicant_first_name || null,
  applicant_last_name: form.applicant_last_name || null,
  contact_email: form.contact_email || null,
  phone: form.phone || null,
  applicant_city: form.applicant_city || null,
  applicant_address: form.applicant_address || null,
  applicant_date_of_birth: form.applicant_date_of_birth || null,
});
