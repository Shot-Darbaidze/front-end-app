"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "ka";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    const translations = language === "ka" ? translationsKa : translationsEn;
    const keys = key.split(".");
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translationsEn = {
  hero: {
    title: "Grow Your Business as a",
    titleHighlight: "Driving Instructor",
    description: "Join the fastest growing platform for driving instructors. Manage bookings, get more students, and streamline your business.",
    becomeInstructor: "Become an Instructor",
    calculator: "Calculator"
  },
  stats: {
    activeStudents: "Active Students",
    bookingsMonthly: "Bookings Monthly",
    instructorEarnings: "Instructor Earnings",
    citiesCovered: "Cities Covered"
  },
  howItWorks: {
    badge: "Simple Process",
    title: "Start your journey in",
    titleHighlight: "4 steps",
    description: "We've streamlined the onboarding process so you can focus on what matters most—teaching students how to drive safely.",
    step1Title: "Create Account",
    step1Desc: "Sign up in minutes. Tell us about your experience, vehicle, and teaching preferences.",
    step2Title: "Verify Documents",
    step2Desc: "Upload your driving instructor license and insurance documents for quick verification.",
    step3Title: "Set Your Schedule",
    step3Desc: "Choose when you want to work. Our calendar system handles the bookings automatically.",
    step4Title: "Start Teaching",
    step4Desc: "Receive booking requests from students and start earning money immediately.",
    cta: "Become an Instructor",
    ctaSubtext: "No credit card required • Free to join"
  },
  calculator: {
    title: "Calculate Your Earnings",
    hourlyRate: "Hourly Rate",
    hoursPerWeek: "Hours per Week",
    weeklyIncome: "Weekly Income",
    monthlyIncome: "Monthly Income",
    yearlyPotential: "Yearly Potential",
    disclaimer: "*Estimates based on your inputs. Actual earnings may vary."
  },
  cta: {
    title: "Ready to Start Teaching?",
    description: "Join our community of professional driving instructors and start growing your business today. It takes less than 5 minutes to get started.",
    button: "Create Instructor Account"
  },
  comparison: {
    title: "Compare: Solo vs.",
    titleHighlight: "Instruktori.ge",
    description: "See why thousands of instructors choose our platform to scale their business",
    feature: "Feature",
    soloTeaching: "Solo Teaching",
    platform: "Instruktori.ge",
    timeManagement: "Time Management",
    timeManagementSolo: "Manual scheduling & constant availability",
    timeManagementPlatform: "Set your own hours, automated booking system",
    adminWork: "Administrative Work",
    adminWorkSolo: "Handle payments, contracts, invoices",
    adminWorkPlatform: "Automated payments, documents, analytics",
    studentAcquisition: "Student Acquisition",
    studentAcquisitionSolo: "Rely on word-of-mouth, personal marketing",
    studentAcquisitionPlatform: "1000+ students looking for instructors",
    monthlyIncome: "Monthly Income Potential",
    monthlyIncomeSolo: "Varies, limited by personal network",
    monthlyIncomePlatform: "₾5,000 - ₾15,000 average",
    paymentProcessing: "Payment Processing",
    paymentProcessingSolo: "Chase students for cash/checks",
    paymentProcessingPlatform: "Automatic daily payouts",
    support: "Support & Resources",
    supportSolo: "Figure things out on your own",
    supportPlatform: "24/7 support, training materials, community",
    analytics: "Business Analytics",
    analyticsSolo: "Manual tracking & spreadsheets",
    analyticsPlatform: "Real-time dashboard, insights, growth tracking",
    ctaText: "Ready to scale your business with Instruktori.ge?",
    ctaButton: "Start Your Free Account"
  },
  testimonials: {
    title: "Instructor Stories",
    description: "Hear from professional instructors who have grown their business with us.",
    since: "Instructor since",
    testimonial1: "Since joining, my schedule is fully booked weeks in advance. The platform handles all the scheduling headaches so I can focus on teaching.",
    testimonial2: "The payment system is flawless. I get paid on time every week, and I don't have to chase students for money anymore. Highly recommended!",
    testimonial3: "I love the flexibility. I can set my own hours and take time off whenever I need. It's the perfect way to manage my driving school business."
  },
  faq: {
    title: "Frequently Asked Questions",
    description: "Everything you need to know about becoming an instructor.",
    q1: "How much does it cost to join?",
    a1: "Creating a profile is completely free. We only charge a small commission fee on completed bookings. There are no monthly subscription fees or hidden costs.",
    q2: "When do I get paid?",
    a2: "Payments are processed daily. Earnings from completed lessons are transferred directly to your bank account every day.",
    q3: "Can I set my own prices?",
    a3: "Yes, absolutely! You have full control over your hourly rates and package prices. You can adjust them at any time through your dashboard.",
    q4: "What documents do I need?",
    a4: "You'll need a valid driving instructor license, proof of vehicle insurance, and a clean background check. We'll guide you through the verification process.",
    q5: "How does the calendar work?",
    a5: "You set your availability in our calendar system. Students can only book slots that you've marked as available. You can sync it with your personal calendar too.",
    q6: "What is cancellation protection?",
    a6: "Our cancellation protection policy ensures you're compensated if a student cancels a lesson within 24 hours of the scheduled time. You'll receive 50% of the lesson fee for late cancellations."
  }
};

const translationsKa = {
  hero: {
    title: "გაზარდეთ თქვენი ბიზნესი როგორც",
    titleHighlight: "მართვის ინსტრუქტორი",
    description: "შემოუერთდით სწრაფად მზარდ პლატფორმას მართვის ინსტრუქტორებისთვის. მართეთ ბრონირებები, მიიღეთ მეტი სტუდენტი და გაამარტივეთ თქვენი ბიზნესი.",
    becomeInstructor: "გახდი ინსტრუქტორი",
    calculator: "კალკულატორი"
  },
  stats: {
    activeStudents: "აქტიური სტუდენტები",
    bookingsMonthly: "ყოველთვიური ბრონირებები",
    instructorEarnings: "ინსტრუქტორის შემოსავალი",
    citiesCovered: "ქალაქები დაფარული"
  },
  howItWorks: {
    badge: "მარტივი პროცესი",
    title: "დაიწყეთ თქვენი მოგზაურობა",
    titleHighlight: "4 ნაბიჯში",
    description: "ჩვენ გავამარტივეთ რეგისტრაციის პროცესი, რათა შეძლოთ კონცენტრირება მთავარზე - სტუდენტებისთვის უსაფრთხო მართვის სწავლებაზე.",
    step1Title: "შექმენით ანგარიში",
    step1Desc: "დარეგისტრირდით წუთებში. მოგვიყევით თქვენი გამოცდილების, მანქანის და სწავლების პრეფერენციების შესახებ.",
    step2Title: "დაადასტურეთ დოკუმენტები",
    step2Desc: "ატვირთეთ თქვენი მართვის ინსტრუქტორის ლიცენზია და დაზღვევის დოკუმენტები სწრაფი გადამოწმებისთვის.",
    step3Title: "დააყენეთ თქვენი განრიგი",
    step3Desc: "აირჩიეთ როდის გსურთ მუშაობა. ჩვენი კალენდარის სისტემა ავტომატურად მართავს ბრონირებებს.",
    step4Title: "დაიწყეთ სწავლება",
    step4Desc: "მიიღეთ ბრონირების მოთხოვნები სტუდენტებისგან და დაწყეთ ფულის გამომუშავება დაუყოვნებლივ.",
    cta: "გახდი ინსტრუქტორი",
    ctaSubtext: "საკრედიტო ბარათი არ არის საჭირო • უფასოდ გაწევრიანება"
  },
  calculator: {
    title: "გამოთვალეთ თქვენი შემოსავალი",
    hourlyRate: "საათობრივი განაკვეთი",
    hoursPerWeek: "საათები კვირაში",
    weeklyIncome: "კვირეული შემოსავალი",
    monthlyIncome: "ყოველთვიური შემოსავალი",
    yearlyPotential: "წლიური პოტენციალი",
    disclaimer: "*შეფასებები დაფუძნებულია თქვენს მონაცემებზე. რეალური შემოსავალი შეიძლება განსხვავდებოდეს."
  },
  cta: {
    title: "მზად ხართ სწავლების დასაწყებად?",
    description: "შემოუერთდით პროფესიონალი მართვის ინსტრუქტორების ჩვენს საზოგადოებას და დაიწყეთ თქვენი ბიზნესის გაზრდა დღესვე. ეს 5 წუთზე ნაკლებ დროს სჭირდება.",
    button: "შექმენით ინსტრუქტორის ანგარიში"
  },
  comparison: {
    title: "შეადარეთ: სოლო vs.",
    titleHighlight: "Instruktori.ge",
    description: "ნახეთ რატომ ირჩევენ ათასობით ინსტრუქტორები ჩვენს პლატფორმას თავიანთი ბიზნესის გასაზრდელად",
    feature: "ფუნქცია",
    soloTeaching: "სოლო სწავლება",
    platform: "Instruktori.ge",
    timeManagement: "დროის მართვა",
    timeManagementSolo: "ხელით დაგეგმვა და მუდმივი ხელმისაწვდომობა",
    timeManagementPlatform: "დააყენეთ თქვენი საათები, ავტომატური ბრონირების სისტემა",
    adminWork: "ადმინისტრაციული სამუშაო",
    adminWorkSolo: "გადახდების, კონტრაქტების, ინვოისების მართვა",
    adminWorkPlatform: "ავტომატური გადახდები, დოკუმენტები, ანალიტიკა",
    studentAcquisition: "სტუდენტების მოპოვება",
    studentAcquisitionSolo: "დამოკიდებულება სიტყვიერ რეკლამაზე, პირადი მარკეტინგი",
    studentAcquisitionPlatform: "1000+ სტუდენტი ეძებს ინსტრუქტორებს",
    monthlyIncome: "ყოველთვიური შემოსავლის პოტენციალი",
    monthlyIncomeSolo: "განსხვავებული, შეზღუდული პირადი ქსელით",
    monthlyIncomePlatform: "₾5,000 - ₾15,000 საშუალოდ",
    paymentProcessing: "გადახდის დამუშავება",
    paymentProcessingSolo: "სტუდენტების უკან დევნა ფულის/ჩეკებისთვის",
    paymentProcessingPlatform: "ავტომატური ყოველდღიური გადახდები",
    support: "მხარდაჭერა და რესურსები",
    supportSolo: "თავად გაარკვიეთ ყველაფერი",
    supportPlatform: "24/7 მხარდაჭერა, სასწავლო მასალები, საზოგადოება",
    analytics: "ბიზნეს ანალიტიკა",
    analyticsSolo: "ხელით თვალყურის დევნება და ცხრილები",
    analyticsPlatform: "რეალურ დროში მონაცემთა პანელი, ინსაითები, ზრდის თვალყურის დევნება",
    ctaText: "მზად ხართ გაზარდოთ თქვენი ბიზნესი Instruktori.ge-თან ერთად?",
    ctaButton: "დაიწყეთ თქვენი უფასო ანგარიში"
  },
  testimonials: {
    title: "ინსტრუქტორების ისტორიები",
    description: "მოისმინეთ პროფესიონალი ინსტრუქტორებისგან, რომლებმაც გაზარდეს თავიანთი ბიზნესი ჩვენთან ერთად.",
    since: "ინსტრუქტორი",
    testimonial1: "შემოერთების შემდეგ, ჩემი განრიგი სრულად დაჯავშნილია კვირებით წინ. პლატფორმა მართავს ყველა დაგეგმვის თავისტკივილს, რათა შევძლო კონცენტრირება სწავლებაზე.",
    testimonial2: "გადახდის სისტემა უკიდურესად მშვენიერია. ფულს დროულად ვიღებ ყოველ კვირას და აღარ მიწევს სტუდენტების უკან დევნა. ძალიან გირჩევთ!",
    testimonial3: "მიყვარს მოქნილობა. შემიძლია დავაყენო ჩემი საათები და დამიკავდეს დრო როცა კი მჭირდება. ეს სრულყოფილი გზაა ჩემი ავტოსკოლის ბიზნესის მართვისთვის."
  },
  faq: {
    title: "ხშირად დასმული შეკითხვები",
    description: "ყველაფერი რაც თქვენ უნდა იცოდეთ ინსტრუქტორად გახდომის შესახებ.",
    q1: "რამდენი ღირს გაწევრიანება?",
    a1: "პროფილის შექმნა მთლიანად უფასოა. ჩვენ ვიღებთ მხოლოდ მცირე საკომისიოს დასრულებულ ბრონირებებზე. არ არის ყოველთვიური გამოწერის საფასური ან დამალული ხარჯები.",
    q2: "როდის ვიღებ ფულს?",
    a2: "გადახდები მუშავდება ყოველდღიურად. დასრულებული გაკვეთილებიდან მიღებული შემოსავალი გადაირიცხება თქვენს საბანკო ანგარიშზე ყოველდღე.",
    q3: "შემიძლია დავაყენო ჩემი საკუთარი ფასები?",
    a3: "დიახ, აბსოლუტურად! თქვენ გაქვთ სრული კონტროლი თქვენს საათობრივ განაკვეთებსა და პაკეტის ფასებზე. შეგიძლიათ შეცვალოთ ისინი ნებისმიერ დროს თქვენი დაფის მეშვეობით.",
    q4: "რა დოკუმენტები მჭირდება?",
    a4: "დაგჭირდებათ მოქმედი მართვის ინსტრუქტორის ლიცენზია, მანქანის დაზღვევის დამადასტურებელი დოკუმენტი და სუფთა ბიოგრაფია. ჩვენ გაგიმარტივებთ გადამოწმების პროცესს.",
    q5: "როგორ მუშაობს კალენდარი?",
    a5: "თქვენ აყენებთ თქვენს ხელმისაწვდომობას ჩვენს კალენდარის სისტემაში. სტუდენტებს შეუძლიათ დაჯავშნონ მხოლოდ ის სლოტები, რომლებიც თქვენ მონიშნული გაქვთ ხელმისაწვდომად. შეგიძლიათ სინქრონიზება გაუკეთოთ თქვენს პირად კალენდარსაც.",
    q6: "რა არის გაუქმების დაცვა?",
    a6: "ჩვენი გაუქმების დაცვის პოლიტიკა უზრუნველყოფს, რომ კომპენსაციას მიიღებთ, თუ სტუდენტი გააუქმებს გაკვეთილს დაგეგმილი დროიდან 24 საათის განმავლობაში. მიიღებთ გაკვეთილის საფასურის 50%-ს გვიან გაუქმებისთვის."
  }
};
