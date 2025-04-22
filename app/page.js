"use client";
// import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards/section-cards";
import { useState, useEffect } from "react";
// import data from "./data.json";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import PieChart from "@/components/top-marque/PieChart";
import TopClient, { Barchart } from "@/components/top-client/TopClient";
import Lld from "@/components/lld/Lld";
// import  Chart  from "@/components/chart/Chart";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading delay - remove this in production
    // and trigger setIsLoading(false) when all data is ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SectionCards isLoading={isLoading} />
      {/* <DataTable data={data} /> */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-12 p-8">
        <div className="md:col-span-8 h-[400px]">
          <TopClient isLoadingFn={isLoading} />
        </div>
        <div className="md:col-span-4 h-[400px]">
          <PieChart isLoadingFn={isLoading} />
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive isLoading={isLoading} />
      </div>
      <div className="px-4 lg:px-6">
        <Lld isLoading={isLoading} />
      </div>
      {/* <div className="px-4 lg:px-6"><Chart/></div> */}
    </>
  );
}
