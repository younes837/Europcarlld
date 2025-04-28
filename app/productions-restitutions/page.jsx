"use client"
import BarChartResPro from "./components/BarChartResPro"


export default function page() {
  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Les Productions et les Restitutions des Contrats
      </h2>
      <BarChartResPro />
    </div>
  )
}
