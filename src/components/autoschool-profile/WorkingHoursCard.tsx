import { Clock, Phone } from "lucide-react";

interface WorkingDay {
  days: string;
  hours: string;
  closed?: boolean;
}

interface WorkingHoursCardProps {
  schedule: WorkingDay[];
  phone?: string;
}

const WorkingHoursCard = ({ schedule, phone }: WorkingHoursCardProps) => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...6=Sat
  const isWeekday = day >= 1 && day <= 5;
  const isSaturday = day === 6;
  const isSunday = day === 0;

  const isOpenNow = (() => {
    if (isSunday) return false;
    const hours = now.getHours();
    if (isWeekday) return hours >= 9 && hours < 20;
    if (isSaturday) return hours >= 10 && hours < 17;
    return false;
  })();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">სამუშაო საათები</span>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-lg ${
            isOpenNow
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isOpenNow ? "ახლა ღიაა" : "დახურულია"}
        </span>
      </div>

      <div className="space-y-2 mb-5">
        {schedule.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{item.days}</span>
            <span
              className={`font-semibold ${
                item.closed ? "text-gray-400" : "text-gray-900"
              }`}
            >
              {item.closed ? "დასვენება" : item.hours}
            </span>
          </div>
        ))}
      </div>

      {phone && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#F03D3D] transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:border-[#F03D3D]/30 transition-colors">
              <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#F03D3D]" />
            </div>
            <span className="font-medium">{phone}</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default WorkingHoursCard;
