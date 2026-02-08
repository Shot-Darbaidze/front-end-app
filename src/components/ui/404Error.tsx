"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Error404 = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-20 gap-4 sm:gap-6 px-4">
      {/* Image */}
      <div className="relative flex justify-center w-full">
        <Image
          src="/images/404/404.png"
          alt="404 Error"
          width={500}
          height={500}
          className="object-contain w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] h-auto"
          priority
        />
      </div>

      {/* Title */}
      <h1 className="text-center text-gray-900 font-semibold text-3xl sm:text-4xl md:text-5xl leading-tight">
        Error 404...
      </h1>

      {/* Go Back Button */}
      <button
        className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#F03D3D] text-white rounded-lg font-medium text-sm hover:bg-[#C44545] transition-colors"
        onClick={() => router.back()}
      >
        <span>Go Back</span>
      </button>
    </div>
  );
};

export default Error404;
