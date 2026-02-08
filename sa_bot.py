"""
🚗 sa.gov.ge ჯავშნის მონიტორი
================================
pip install requests
python checker.py
"""

import requests
import time
import json
import logging
import sys
import os
import platform
from datetime import datetime

# ======================================================
# ⚙️ კონფიგურაცია
# ======================================================

CATEGORY_CODE = 4  # B კატეგორია

CENTER_IDS = [3]  # ქუთაისი სატესტოდ. შეცვალე: [15] რუსთავი, [2,15] ორივე, და ა.შ.

#  2 = ქუთაისი      3 = ბათუმი       4 = თელავი
#  5 = ახალციხე     6 = ზუგდიდი      7 = გორი
#  8 = ფოთი         9 = ოზურგეთი    10 = საჩხერე
# 15 = რუსთავი

ALL_CENTERS = {
    2: "ქუთაისი", 3: "ბათუმი", 4: "თელავი", 5: "ახალციხე",
    6: "ზუგდიდი", 7: "გორი", 8: "ფოთი", 9: "ოზურგეთი",
    10: "საჩხერე", 15: "რუსთავი",
}

CHECK_INTERVAL = 60  # წამი

# --- Telegram ---
TELEGRAM_ENABLED = False
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "YOUR_CHAT_ID")

# --- ხმოვანი სიგნალი ---
SOUND_ENABLED = True

# ======================================================

BASE_URL = "https://api-bookings.sa.gov.ge/api/v1/DrivingLicensePracticalExams2"
DATES_URL = f"{BASE_URL}/DrivingLicenseExamsDates2"

session = requests.Session()
session.headers.update({
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ka",
    "Origin": "https://my.sa.gov.ge",
    "Referer": "https://my.sa.gov.ge/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
})

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("checker.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("checker")


# ======================================================
# შეტყობინებები
# ======================================================

def notify_telegram(message: str):
    if not TELEGRAM_ENABLED:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"},
            timeout=10,
        )
    except Exception as e:
        log.error(f"Telegram error: {e}")


def notify_sound():
    if not SOUND_ENABLED:
        return
    system = platform.system()
    for _ in range(10):
        if system == "Darwin":  # macOS
            os.system("afplay /System/Library/Sounds/Glass.aiff &")
        elif system == "Linux":
            os.system("paplay /usr/share/sounds/freedesktop/stereo/bell.oga 2>/dev/null || aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null &")
        elif system == "Windows":
            import winsound
            winsound.Beep(1000, 300)
        else:
            sys.stdout.write("\a")
            sys.stdout.flush()
        time.sleep(0.3)


# ======================================================
# შემოწმება
# ======================================================

def check_center(category_code: int, center_id: int) -> list:
    try:
        resp = session.get(
            DATES_URL,
            params={"CategoryCode": category_code, "CenterId": center_id},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            return []
        return [d for d in data if d.get("bookingDateStatus") == 1]
    except Exception as e:
        log.warning(f"  ⚠️ {ALL_CENTERS.get(center_id, center_id)}: {e}")
        return []


# ======================================================
# მთავარი
# ======================================================

def main():
    centers = {cid: ALL_CENTERS.get(cid, f"#{cid}") for cid in CENTER_IDS}

    log.info("🚗 sa.gov.ge ჯავშნის მონიტორი")
    log.info(f"   კატეგორია: {CATEGORY_CODE} | ცენტრები: {', '.join(centers.values())}")
    log.info(f"   ინტერვალი: {CHECK_INTERVAL}წმ | Telegram: {'✅' if TELEGRAM_ENABLED else '❌'}")
    log.info("-" * 50)

    check_count = 0
    previously_found = {}

    while True:
        check_count += 1
        now = datetime.now().strftime("%H:%M:%S")
        new_slots_found = False

        for cid in CENTER_IDS:
            name = centers[cid]
            dates = check_center(CATEGORY_CODE, cid)

            if dates:
                current_dates = {d["bookingDate"] for d in dates}
                prev_dates = previously_found.get(cid, set())
                new_dates = current_dates - prev_dates

                if new_dates:
                    new_slots_found = True
                    new_list = sorted(new_dates)
                    log.info(f"  🎉 {name}: ახალი თარიღები → {', '.join(new_list)}")

                    msg = (
                        f"🚗🎉 ჯავშანი გაიხსნა!\n\n"
                        f"📍 {name}\n"
                        f"📅 {', '.join(new_list)}\n"
                        f"(სულ {len(current_dates)} თარიღი)\n\n"
                        f"🔗 https://my.sa.gov.ge/drivinglicenses/practicalexam"
                    )
                    notify_sound()
                    notify_telegram(msg)

                previously_found[cid] = current_dates
            else:
                if cid in previously_found and previously_found[cid]:
                    log.info(f"  ⚠️ {name}: ადგილები გაიყიდა!")
                previously_found[cid] = set()

        if not new_slots_found:
            statuses = []
            for cid in CENTER_IDS:
                name = centers[cid]
                count = len(previously_found.get(cid, set()))
                statuses.append(f"{name}: {count}📅" if count else f"{name}: ❌")
            log.info(f"[{now}] #{check_count} — {' | '.join(statuses)}")

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("\n🛑 გაჩერდა")
