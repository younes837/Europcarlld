"use client";
import { useState, useEffect } from "react";
import Loading from "./loading";
import { useRouter } from "next/navigation";

export default function Template({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setIsLoading(false);
    };

    window.addEventListener("beforeunload", handleRouteChangeStart);
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (
        link &&
        link.getAttribute("href") &&
        !link.getAttribute("href").startsWith("#")
      ) {
        handleRouteChangeStart();
      }
    });
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => {
      window.removeEventListener("beforeunload", handleRouteChangeStart);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [children]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
}
