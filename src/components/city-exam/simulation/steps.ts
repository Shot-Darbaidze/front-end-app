import type { HotspotId } from "./FabiaInterior";

export type SimulationStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  hotspotId: HotspotId;
  hint: string;
};

// The correct sequence when you get into the exam car (Skoda Rapid)
export const EXAM_STEPS: SimulationStep[] = [
  {
    id: "seat",
    order: 1,
    title: "სავარძლის მორგება",
    description: "მოარგეთ სავარძელი თქვენს სიმაღლეს — წინ/უკან და სიმაღლე",
    hotspotId: "seat",
    hint: "სავარძელი მანქანის ქვედა მარცხენა ნაწილშია",
  },
  {
    id: "mirrors",
    order: 2,
    title: "სარკეების მორგება",
    description: "მოარგეთ შიდა და გარე სარკეები",
    hotspotId: "mirrors",
    hint: "სარკის ღილაკი კარის პანელზეა, შიდა სარკე ზემოთაა",
  },
  {
    id: "seatbelt",
    order: 3,
    title: "უსაფრთხოების ღვედი",
    description: "შეიკარით უსაფრთხოების ღვედი",
    hotspotId: "seatbelt",
    hint: "ღვედი მარცხენა მხარის ზემოთ, B სვეტზეა",
  },
  {
    id: "check-gear",
    order: 4,
    title: "გადაცემათა კოლოფის შემოწმება",
    description: "დარწმუნდით, რომ ნეიტრალზეა (გადაცემა არ არის ჩართული)",
    hotspotId: "gear",
    hint: "გადაცემათა კოლოფი ცენტრალურ კონსოლზეა",
  },
  {
    id: "clutch",
    order: 5,
    title: "ქლაჩის დაჭერა",
    description: "სრულად დააჭირეთ ქლაჩის პედალს",
    hotspotId: "clutch",
    hint: "ქლაჩი ყველაზე მარცხენა პედალია",
  },
  {
    id: "start-engine",
    order: 6,
    title: "ძრავის ჩართვა",
    description: "გადაატრიალეთ გასაღები ან დააჭირეთ Start ღილაკს",
    hotspotId: "ignition",
    hint: "გასაღები/ღილაკი საჭის მარჯვნივაა",
  },
  {
    id: "handbrake",
    order: 7,
    title: "ხელის მუხრუჭის მოხსნა",
    description: "ჩამოწიეთ ხელის მუხრუჭი",
    hotspotId: "handbrake",
    hint: "ხელის მუხრუჭი გადაცემათა კოლოფის უკან არის",
  },
  {
    id: "signal",
    order: 8,
    title: "მაშუქი (მარცხენა შუქი)",
    description: "ჩართეთ მარცხენა მაშუქი გადაადგილებამდე",
    hotspotId: "signal",
    hint: "მაშუქის ბერკეტი საჭის მარცხნივაა",
  },
  {
    id: "check-mirrors-move",
    order: 9,
    title: "სარკეების შემოწმება და დაძვრა",
    description: "შეამოწმეთ სარკეები, ნელა აუშვით ქლაჩი და დაიძარით",
    hotspotId: "mirrors",
    hint: "ბოლოს კიდევ ერთხელ შეხედეთ სარკეებს",
  },
];
