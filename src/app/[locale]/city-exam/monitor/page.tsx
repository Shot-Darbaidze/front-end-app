"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useExamMonitor, CITY_CENTERS } from "@/hooks/useExamMonitor";
import { Bell, MapPin, Play, Square, AlertCircle, CheckCircle } from "lucide-react";
import { CityExamNav } from "@/components/city-exam/CityExamNav";
import { API_CONFIG } from "@/config/constants";

interface SubscriptionService {
  code: string;
  name: string;
  contact_kind: "email" | "phone";
  monthly_price_tetri: number;
  monthly_price_gel: string;
}

const CityExamPage = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const isAuthenticated = Boolean(user?.id);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [services, setServices] = useState<SubscriptionService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [contactDefaults, setContactDefaults] = useState<{ email: string; phone: string }>({
    email: "",
    phone: "",
  });
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>("");
  const [selectedService, setSelectedService] = useState<SubscriptionService | null>(null);
  const [wantsDefaultContact, setWantsDefaultContact] = useState<boolean | null>(null);
  const [customContactValue, setCustomContactValue] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isSubmittingSubscription, setIsSubmittingSubscription] = useState(false);
  const {
    isMonitoring,
    availableSlots,
    newSlotsNotification,
    startMonitoring,
    stopMonitoring,
    clearNotification,
    isLoading,
    error,
  } = useExamMonitor();
  const isKa = true;

  const handleStartMonitoring = () => {
    if (!isAuthenticated) {
      setAuthNotice("მონიტორინგის დასაწყებად აუცილებელია ავტორიზაცია.");
      return;
    }
    if (selectedCity) {
      setAuthNotice(null);
      startMonitoring(selectedCity);
    }
  };

  const cityOptions = Object.entries(CITY_CENTERS).map(([id, name]) => ({
    id: parseInt(id),
    name,
  }));

  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true);
      setServicesError(null);
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/subscriptions/services`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`სერვისების ჩატვირთვა ვერ მოხერხდა: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("სერვისების პასუხი არასწორია");
        }
        setServices(data);
        setSelectedServiceCode((prev) => prev || data[0]?.code || "");
      } catch (err) {
        const message = err instanceof Error ? err.message : "სერვისების ჩატვირთვა ვერ მოხერხდა";
        setServicesError(message);
      } finally {
        setServicesLoading(false);
      }
    };

    void fetchServices();
  }, []);

  useEffect(() => {
    const fetchContactDefaults = async () => {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/subscriptions/contact-defaults`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => ({}));
        setContactDefaults({
          email: typeof data?.email === "string" ? data.email : "",
          phone: typeof data?.phone === "string" ? data.phone : "",
        });
      } catch {
        // Non-blocking: fallback to Clerk-derived values below.
      }
    };

    if (isLoaded && isAuthenticated) {
      void fetchContactDefaults();
    }
  }, [getToken, isLoaded, isAuthenticated]);

  const defaultEmail = useMemo(() => {
    return (
      contactDefaults.email ||
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      ""
    );
  }, [contactDefaults.email, user]);

  const defaultPhone = useMemo(() => {
    return (
      contactDefaults.phone ||
      user?.primaryPhoneNumber?.phoneNumber ||
      user?.phoneNumbers?.[0]?.phoneNumber ||
      ""
    );
  }, [contactDefaults.phone, user]);

  const selectedDefaultContact = useMemo(() => {
    if (!selectedService) {
      return "";
    }
    return selectedService.contact_kind === "email" ? defaultEmail : defaultPhone;
  }, [selectedService, defaultEmail, defaultPhone]);

  const selectedContactLabel = selectedService?.contact_kind === "email" ? "email" : "number";

  const openSubscriptionModal = (service: SubscriptionService) => {
    if (!isAuthenticated) {
      setAuthNotice("სერვისის გამოსაწერად აუცილებელია ავტორიზაცია.");
      return;
    }
    setAuthNotice(null);
    setSelectedService(service);
    setWantsDefaultContact(null);
    setCustomContactValue("");
    setSubscriptionError(null);
    setSubscriptionMessage(null);
    setIsSubscriptionModalOpen(true);
  };

  const selectedServiceFromList = useMemo(() => {
    return services.find((service) => service.code === selectedServiceCode) ?? null;
  }, [services, selectedServiceCode]);

  const closeSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
    setSelectedService(null);
    setWantsDefaultContact(null);
    setCustomContactValue("");
    setSubscriptionError(null);
  };

  const subscribe = async () => {
    if (!selectedService) {
      return;
    }

    if (selectedDefaultContact && wantsDefaultContact === null) {
      setSubscriptionError(`გთხოვ აირჩიო, გინდა თუ არა მიმდინარე ${selectedContactLabel === "email" ? "იმეილის" : "ნომრის"} გამოყენება.`);
      return;
    }

    const useDefault = wantsDefaultContact === true;
    const customValue = customContactValue.trim();
    if (!useDefault && !customValue) {
      setSubscriptionError(`გთხოვ შეიყვანო ${selectedContactLabel === "email" ? "იმეილი" : "ნომერი"}.`);
      return;
    }

    setIsSubmittingSubscription(true);
    setSubscriptionError(null);
    setSubscriptionMessage(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("გამოსაწერად ავტორიზაცია აუცილებელია");
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/subscriptions/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          service_code: selectedService.code,
          use_default_contact: useDefault,
          contact_value: useDefault ? null : customValue,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "გამოწერა ვერ შესრულდა";
        throw new Error(detail);
      }

      setSubscriptionMessage("გამოწერა წარმატებით გააქტიურდა.");
      setTimeout(() => {
        closeSubscriptionModal();
      }, 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : "გამოწერა ვერ შესრულდა";
      setSubscriptionError(message);
    } finally {
      setIsSubmittingSubscription(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#F03D3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
    <main className="pt-6">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ქალაქის გამოცდის მონიტორი
          </h1>
          <p className="text-gray-600">
            აკონტროლე თავისუფალი საგამოცდო სლოტები და მიიღე შეტყობინება მათი გახსნისთანავე
          </p>
        </div>

        {!isAuthenticated && (
          <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ავტორიზაცია აუცილებელია. გთხოვ გაიარე ავტორიზაცია, რომ გამოიყენო მონიტორინგი და გამოწერის სერვისები.
          </div>
        )}

        {authNotice && (
          <div className="mb-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {authNotice}
          </div>
        )}

        {/* Notification Alert */}
        {newSlotsNotification && (
          <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-pulse">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-green-900">
                  🎉 ახალი საგამოცდო სლოტები დაემატა!
                </h3>
                <p className="text-green-800 mt-1">
                  {newSlotsNotification.map((slot) => slot.bookingDate).join(", ")}
                </p>
                <button
                  onClick={clearNotification}
                  className="text-sm text-green-700 hover:text-green-900 mt-2 font-medium"
                >
                  დახურვა
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900">შეცდომა</h3>
                
                <p className="text-red-800 mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Section */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">გამოწერის სერვისები</h2>
          <div className="mb-6 rounded-xl border border-[#F03D3D]/20 bg-red-50 p-5">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F03D3D]">
                გამოწერის სერვისები
              </p>
              <p className="mt-1 text-sm text-gray-800">
                თუ გინდა რომ მიიღო ღია სლოტების და ჯავშნების შესახებ გამოიწერე ეს სერვისი.
              </p>
            </div>

            {servicesLoading && (
              <p className="text-sm text-gray-600">სერვისები იტვირთება...</p>
            )}

            {servicesError && (
              <p className="text-sm text-red-700">
                {servicesError}
              </p>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedServiceCode(service.code)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedServiceCode(service.code);
                    }
                  }}
                  className={`flex cursor-pointer flex-col gap-3 rounded-lg border bg-white p-4 transition ${
                    selectedServiceCode === service.code
                      ? "border-[#F03D3D] ring-2 ring-[#F03D3D]/20"
                      : "border-[#F03D3D]/20 hover:border-[#F03D3D]/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          selectedServiceCode === service.code
                            ? "border-[#F03D3D] bg-[#F03D3D]"
                            : "border-gray-400"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      შეტყობინება {service.contact_kind === "email" ? "იმეილზე" : "ნომერზე"}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      ფასი: ₾{(service.monthly_price_tetri / 100).toFixed(2)} / თვე
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!servicesLoading && !servicesError && services.length === 0 && (
              <p className="text-sm text-gray-600">აქტიური სერვისები ვერ მოიძებნა.</p>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  if (selectedServiceFromList) {
                    openSubscriptionModal(selectedServiceFromList);
                  }
                }}
                disabled={!selectedServiceFromList || !isAuthenticated}
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#F03D3D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                გაგრძელება არჩეული სერვისით
              </button>
            </div>
          </div>
        </div>

        {/* Monitoring Section */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">გამოცდის მონიტორინგი</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* City Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-[#F03D3D]" />
                  აირჩიე ქალაქი
                </div>
              </label>
              <select
                value={selectedCity ?? ""}
                onChange={(e) => setSelectedCity(parseInt(e.target.value) || null)}
                disabled={isMonitoring || !isAuthenticated}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F03D3D] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">აირჩიე ქალაქი...</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {isMonitoring && selectedCity && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ✓ მიმდინარეობს მონიტორინგი: {CITY_CENTERS[selectedCity as keyof typeof CITY_CENTERS]}
                </p>
              )}
            </div>

            {/* Status Display */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-[#F03D3D]" />
                  მონიტორინგის სტატუსი
                </div>
              </label>
              <div className={`w-full px-4 py-3 border-2 rounded-lg text-center font-medium ${
                isMonitoring
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300 bg-gray-50 text-gray-600"
              }`}>
                {isMonitoring ? "🟢 მონიტორინგი აქტიურია" : "🔴 მონიტორინგი გამორთულია"}
              </div>
              {isLoading && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  სლოტები იტვირთება...
                </p>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleStartMonitoring}
              disabled={!selectedCity || isMonitoring || !isAuthenticated}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#F03D3D] text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" />
              მონიტორინგის დაწყება
            </button>
            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring || !isAuthenticated}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <Square className="w-5 h-5" />
              მონიტორინგის გაჩერება
            </button>
          </div>
        </div>

        {/* Available Slots Display */}
        {availableSlots.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ხელმისაწვდომი საგამოცდო თარიღები ({availableSlots.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.map((slot) => (
                <div
                  key={slot.bookingDate}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center"
                >
                  <p className="text-sm text-blue-600 font-medium">ხელმისაწვდომია</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Date(slot.bookingDate).toLocaleDateString("ka-GE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 როგორ მუშაობს:
          </h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• აირჩიე სასურველი ქალაქი</li>
            <li>• დააჭირე &quot;მონიტორინგის დაწყებას&quot;, რომ სლოტების შემოწმება დაიწყოს</li>
            <li>• ახალ საგამოცდო თარიღებზე მიიღებ შეტყობინებას</li>
            <li>• დეტალური ლოგების სანახავად შეამოწმე console (F12)</li>
          </ul>
        </div>
      </div>
    </main>

    {isSubscriptionModalOpen && selectedService && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900">{selectedService.name}</h2>
          <p className="mt-3 text-sm text-gray-700">
            თუ გინდა რომ მიიღო ღია სლოტების და ჯავშნების შესახებ გამოიწერე ეს სერვისი.
          </p>
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">სერვისის ფასი</p>
            <p className="mt-1 text-lg font-bold text-gray-900">₾{(selectedService.monthly_price_tetri / 100).toFixed(2)} / თვე</p>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">
              გინდა შეტყობინება ამ {selectedContactLabel === "email" ? "იმეილზე" : "ნომერზე"} მიიღო?
            </p>

            {selectedDefaultContact ? (
              <p className="mt-1 text-sm text-gray-700">{selectedDefaultContact}</p>
            ) : (
              <p className="mt-1 text-sm text-amber-700">
                სტანდარტული {selectedContactLabel === "email" ? "იმეილი" : "ნომერი"} ვერ მოიძებნა. ქვემოთ შეიყვანე.
              </p>
            )}

            {selectedDefaultContact && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWantsDefaultContact(true);
                    setSubscriptionError(null);
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                    wantsDefaultContact === true
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  კი
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWantsDefaultContact(false);
                    setSubscriptionError(null);
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                    wantsDefaultContact === false
                      ? "bg-[#F03D3D] text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  არა
                </button>
              </div>
            )}

            {(!selectedDefaultContact || wantsDefaultContact === false) && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                  შეიყვანე {selectedContactLabel === "email" ? "იმეილი" : "ნომერი"}
                </label>
                <input
                  value={customContactValue}
                  onChange={(e) => setCustomContactValue(e.target.value)}
                  placeholder={selectedService.contact_kind === "email" ? "example@gmail.com" : "+9955XXXXXXXX"}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#F03D3D]"
                />
              </div>
            )}
          </div>

          {subscriptionError && (
            <p className="mt-3 text-sm text-red-700">{subscriptionError}</p>
          )}
          {subscriptionMessage && (
            <p className="mt-3 text-sm text-green-700">{subscriptionMessage}</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={closeSubscriptionModal}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              დახურვა
            </button>
            <button
              type="button"
              onClick={subscribe}
              disabled={isSubmittingSubscription}
              className="flex-1 rounded-lg bg-[#F03D3D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              {isSubmittingSubscription ? "ინახება..." : "გაგრძელება"}
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};

export default CityExamPage;
