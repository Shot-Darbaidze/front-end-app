import HeroModern from "@/components/home/HeroModern";
import TrustStrip from "@/components/home/TrustStrip";
import BentoFeatures from "@/components/home/BentoFeatures";
import LearningRoadmap from "@/components/home/LearningRoadmap";
import InstructorShowcase from "@/components/home/InstructorShowcase";

export default function MainPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroModern />
      <TrustStrip />
      <BentoFeatures />
      <LearningRoadmap />
      <InstructorShowcase />
    </div>
  );
}

