import BlogHero from "@/components/blog/BlogHero";
import BlogGrid from "@/components/blog/BlogGrid";
import NewsletterCTA from "@/components/blog/NewsletterCTA";

export default function BlogTestPage() {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      <main>
        <BlogHero />
        <BlogGrid />
        <NewsletterCTA />
      </main>
    </div>
  );
}
