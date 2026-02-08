"use client";

import { CarFront } from "lucide-react";
import { useState } from "react";

const NewsletterCTA = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please input correct mail");
      return;
    }

    setError("");
  };

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">Subscribe for quick tips</h2>
            <p className="text-base text-slate-600">Weekly driving tips. No spam.</p>
          </div>

          <form className="w-full sm:w-auto" onSubmit={handleSubmit} noValidate>
            <div className="relative w-full sm:w-[32rem]">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setEmail(nextValue);
                  if (error && isValidEmail(nextValue)) {
                    setError("");
                  }
                }}
                onBlur={() => {
                  if (email && !isValidEmail(email)) {
                    setError("Please input correct mail");
                  }
                }}
                className={`w-full px-5 py-4 pr-32 text-base rounded-full border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white ${
                  error ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"
                }`}
                required
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-5 text-base rounded-full bg-[#F03D3D] text-white font-semibold hover:bg-red-600 transition-colors inline-flex items-center gap-2"
              >
                Subscribe <CarFront className="w-5 h-5" />
              </button>
            </div>
            {error ? <p className="mt-2 text-xs text-red-500 font-medium">{error}</p> : null}
          </form>
        </div>
      </div>
      </section>
  );
};

export default NewsletterCTA;
