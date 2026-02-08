import { Calendar, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const articles = [
	{
		id: 1,
		title: "Understanding Road Signs: A Complete Guide",
		excerpt: "Don't let road signs confuse you. Learn the meanings behind the most common and obscure signs.",
		category: "Theory",
		date: "Mar 15, 2024",
		readTime: "5 min read",
		image: "bg-blue-500",
		size: "large", // Bento grid feature
	},
	{
		id: 2,
		title: "Manual vs Automatic: Which Should You Choose?",
		excerpt: "Pros and cons of each transmission type to help you decide which license to pursue.",
		category: "Advice",
		date: "Mar 12, 2024",
		readTime: "4 min read",
		image: "bg-purple-500",
		size: "small",
	},
	{
		id: 3,
		title: "Top 5 Mistakes to Avoid on Your Driving Test",
		excerpt: "Learn from the common errors that cause students to fail their practical exam.",
		category: "Test Tips",
		date: "Mar 10, 2024",
		readTime: "6 min read",
		image: "bg-orange-500",
		size: "small",
	},
	{
		id: 4,
		title: "Night Driving: Safety Tips for New Drivers",
		excerpt: "Driving at night comes with its own set of challenges. Here is how to stay safe.",
		category: "Safety",
		date: "Mar 08, 2024",
		readTime: "4 min read",
		image: "bg-indigo-500",
		size: "medium",
	},
	{
		id: 5,
		title: "Eco-Driving: Save Fuel and the Environment",
		excerpt: "Simple techniques to reduce your fuel consumption and carbon footprint.",
		category: "Eco",
		date: "Mar 05, 2024",
		readTime: "3 min read",
		image: "bg-green-500",
		size: "medium",
	},
];

const BlogGrid = () => {
	return (
		<section className="py-20 bg-[#0F172A] text-white">
			<div className="max-w-7xl mx-auto px-6">
				<div className="flex justify-between items-end mb-12">
					<div>
						<h2 className="text-3xl font-bold mb-2">Latest Articles</h2>
						<p className="text-gray-400">Stay updated with the latest driving tips and news.</p>
					</div>
					<button className="text-[#F03D3D] font-medium hover:text-white transition-colors flex items-center gap-2">
						View All <ArrowUpRight className="w-4 h-4" />
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
					{articles.map((article, _index) => (
						<div
							key={article.id}
							className={`group relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg hover:border-[#F03D3D]/50 transition-all duration-300 ${
								article.size === "large" ? "md:col-span-2" : ""
							}`}
						>
							{/* Image Placeholder */}
							<div
								className={`absolute inset-0 ${article.image} opacity-20 group-hover:opacity-30 transition-opacity`}
							/>

							<div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

							<div className="absolute bottom-0 left-0 p-8 w-full">
								<div className="flex items-center gap-4 mb-4 text-sm text-gray-300">
									<span className="bg-white/10 px-3 py-1 rounded-full text-white backdrop-blur-sm border border-white/10">
										{article.category}
									</span>
									<div className="flex items-center gap-1">
										<Calendar className="w-3 h-3" /> {article.date}
									</div>
									<div className="flex items-center gap-1">
										<Clock className="w-3 h-3" /> {article.readTime}
									</div>
								</div>

								<h3
									className={`font-bold mb-3 group-hover:text-[#F03D3D] transition-colors ${
										article.size === "large" ? "text-3xl" : "text-xl"
									}`}
								>
									{article.title}
								</h3>

								<p className="text-gray-400 line-clamp-2 mb-4">{article.excerpt}</p>

								<Link
									href={`/blog/post-${article.id}`}
									className="inline-flex items-center text-white font-medium hover:gap-2 transition-all"
								>
									Read More <ArrowUpRight className="ml-1 w-4 h-4" />
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default BlogGrid;
