import HeroModern from "@/components/home/HeroModern";
import TrustStrip from "@/components/home/TrustStrip";
import LearningRoadmap from "@/components/home/LearningRoadmap";
import InstructorShowcase from "@/components/home/InstructorShowcase";
import InstructorCTA from "@/components/home/InstructorCTA";

export default function MainPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroModern />
      <TrustStrip />
      <LearningRoadmap />
      <InstructorShowcase />
      <InstructorCTA />
    </div>
  );
}

