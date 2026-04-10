import type { CoursePackage as ServiceCoursePackage } from "@/services/autoschoolService";

export type InstructorPost = {
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
    phone?: string | null;
    applicant_city?: string | null;
    applicant_address?: string | null;
    applicant_date_of_birth?: string | null;
    is_approved?: boolean | null;
    status?: "active" | "inactive" | string | null;
    instructor_type?: "independent" | "employee" | string | null;
    packages?: CoursePackage[];
};

export type CoursePackage = ServiceCoursePackage;

export type InstructorAsset = {
    id: string;
    instructor_id: string;
    asset_type: string;
    url?: string | null;
    object_key: string;
    original_filename?: string | null;
    content_type?: string | null;
    file_size?: number | null;
    is_private?: boolean;
    created_at?: string | null;
};

export type InstructorProfileForm = {
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
    phone: string;
    applicant_city: string;
    applicant_address: string;
    applicant_date_of_birth: string;
    status: "active" | "inactive";
};

export const emptyInstructorForm: InstructorProfileForm = {
    title: "", description: "", located_at: "", google_maps_url: "",
    automatic_city_price: "", automatic_yard_price: "",
    manual_city_price: "", manual_yard_price: "",
    language_skills: "", applicant_first_name: "", applicant_last_name: "",
    phone: "", applicant_city: "",
    applicant_address: "", applicant_date_of_birth: "", status: "inactive",
};

export { PRIMARY_LANGUAGE_OPTIONS, OTHER_LANGUAGE_OPTIONS, ALL_LANGUAGE_OPTIONS } from "@/config/constants";
import { ALL_LANGUAGE_OPTIONS } from "@/config/constants";

const LANGUAGE_LABELS = new Map(
    ALL_LANGUAGE_OPTIONS.map((i) => [i.code, i.label])
);

export const normalizeLanguageCodes = (value: string) =>
    value.split(",").map((i) => i.trim().toLowerCase()).filter(Boolean);

export const serializeLanguageCodes = (codes: string[]) =>
    codes.length ? `${codes.join(",")},` : "";

export const formatLanguageLabels = (value: string) =>
    normalizeLanguageCodes(value).map((c) => LANGUAGE_LABELS.get(c) || c).join(", ");

export const normalizeTransmission = (value?: string | null) => (value || "").trim().toLowerCase();

export const normalizeNumber = (value?: number | null) =>
    value === null || value === undefined ? "" : String(value);

export const normalizeDate = (value?: string | null) => (!value ? "" : value.split("T")[0]);

const toNumber = (value: string) => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

export const mapPostToForm = (post: InstructorPost): InstructorProfileForm => ({
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
    phone: post.phone || "",
    applicant_city: post.applicant_city || "",
    applicant_address: post.applicant_address || "",
    applicant_date_of_birth: normalizeDate(post.applicant_date_of_birth),
    // Treat missing/legacy status values as inactive by default.
    status: post.status === "active" ? "active" : "inactive",
});

export const buildUpdatePayload = (form: InstructorProfileForm) => ({
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
    phone: form.phone || null,
    applicant_city: form.applicant_city || null,
    applicant_address: form.applicant_address || null,
    applicant_date_of_birth: form.applicant_date_of_birth || null,
    status: form.status,
});
