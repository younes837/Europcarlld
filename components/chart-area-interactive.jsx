"use client"

import * as React from "react"
import { useState,useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Skeleton } from "./ui/skeleton"

export const description = "An interactive area chart"

const chartConfig = {
  visitors: {
    label: "Nombre de Produtions et Restitutions par Trimestre",
  },

  produtions: {
    label: "Nombre de Produtions",
    color: "#22c55e",
  },

  restitutions: {
    label: "Nombre de Restitutions",
    color: "#84cc16",
  }
}

export function ChartAreaInteractive() {
  const [labels, setLabels] = useState(null);
  const [produtions, setProdutions] = useState(null);
  const [restitutions, setRestitutions] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading,setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch("http://localhost:3001/api/total_contrat"),
          fetch("http://localhost:3001/api/restitution_contrat"),
        ]);

        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

        const lab = data1.map(item => `T${item.Trimestre} ${item.Annee}`);
        setLabels(lab);

        setProdutions(
          lab.map(label => {
            const item = data1.find(d => `T${d.Trimestre} ${d.Annee}` === label);
            return item ? item.NombreContrats : null;
          })
        );

        setRestitutions(
          lab.map(label => {
            const item = data2.find(d => `T${d.Trimestre} ${d.Annee}` === label);
            return item ? item.NombreContrats : null;
          })
        );

        const dynamicChartData = lab.map((label, index) => ({
          date: label,
          produtions: data1[index]?.NombreContrats ?? 0,
          restitutions: data2.find(d => `T${d.Trimestre} ${d.Annee}` === label)?.NombreContrats ?? 0,
        }));

        setChartData(dynamicChartData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }finally{
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = chartData.filter((item) => {
    const dateParts = item.date.split(" "); // Example: ["T1", "2016"]
    const trimester = parseInt(dateParts[0].substring(1)); // T1 -> 1
    const year = parseInt(dateParts[1]); // 2016 -> 2016

    const monthMap = { 1: 0, 2: 3, 3: 6, 4: 9 }; // Approximate start months
    const date = new Date(year, monthMap[trimester]);

    const referenceDate = new Date(); // Current date

    // Show data from the first available trimester until today
    return date <= referenceDate;
  });
  if (isLoading) {
    return     <div className="flex flex-col space-y-3 justify-center">
    <Skeleton className="h-[200px] w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[800px]" />
      <Skeleton className="h-4 w-[600px]" />
    </div>
  </div>
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Nombre de Produtions et Restitutions par Trimestre</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total depuis le début jusqu'à aujourd'hui
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillprodutions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-produtions)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-produtions)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillrestitutions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-restitutions)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-restitutions)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return value; // Display the custom trimester format
              }} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return value; // Custom date formatting if needed
                  }}
                  indicator="dot" />
              } />
            <Area
              dataKey="restitutions"
              type="natural"
              fill="url(#fillrestitutions)"
              stroke="var(--color-restitutions)"
              stackId="a" />
            <Area
              dataKey="produtions"
              type="natural"
              fill="url(#fillprodutions)"
              stroke="var(--color-produtions)"
              stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

