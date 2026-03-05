"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function NotificationSettings({ isInstructor }: { isInstructor: boolean }) {
    const { t } = useLanguage();

    const studentNotifications = [
        { title: t("settings.notifications.lessonReminders"), desc: t("settings.notifications.lessonRemindersDesc") },
        { title: t("settings.notifications.newMessages"), desc: t("settings.notifications.newMessagesDesc") },
        { title: t("settings.notifications.marketingUpdates"), desc: t("settings.notifications.marketingUpdatesDesc") },
    ];

    const instructorNotifications = [
        { title: t("settings.notifications.newBookings"), desc: t("settings.notifications.newBookingsDesc") },
        { title: t("settings.notifications.cancellations"), desc: t("settings.notifications.cancellationsDesc") },
        { title: t("settings.notifications.newMessages"), desc: t("settings.notifications.newMessagesDesc") },
        { title: t("settings.notifications.marketingUpdates"), desc: t("settings.notifications.marketingUpdatesDesc") },
    ];

    const notifications = isInstructor ? instructorNotifications : studentNotifications;

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-6">{t("settings.notifications.title")}</h3>
            <div className="space-y-6">
                {notifications.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                        <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F03D3D]" />
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
