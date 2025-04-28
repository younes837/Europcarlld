"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"


// const chartData = [
//   { month: "January", Productions: 186, Restitutions: 80 },
//   { month: "February", Productions: 305, Restitutions: 200 },
//   { month: "March", Productions: 237, Restitutions: 120 },
//   { month: "April", Productions: 73, Restitutions: 190 },
//   { month: "May", Productions: 209, Restitutions: 130 },
//   { month: "June", Productions: 214, Restitutions: 140 },
// ]


const chartConfig = {
  Productions: {
    label: "Productions",
    color: "#65a30d",
  },
  Restitutions: {
    label: "Restitutions",
    color: "#16a34a",
  },
} 

export default function BarChartResPro() {
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productions`)
      const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/restitutions`)
      const data1 = await res1.json()
      const data2 = await res2.json()
      const data = data1.map((item) => ({
        Annee: item.Annee,
        Productions: item.nombreContrats,
        Restitutions: data2.find((restitution) => restitution.Annee === item.Annee)?.nombreContrats || 0,
      }))
      return data
    } catch (error) {
      console.error("Error fetching data:", error)
      return []
    }
  }

  useEffect(() => {
    fetchData().then((data) => {
      setChartData(data)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return (
      <Card>
        {/* <CardHeader>
          <center>
            <CardTitle>Les Productions Et Les Restitutions Des Contrats</CardTitle>
            <CardDescription>Depuis 2016</CardDescription>
          </center>
        </CardHeader> */}
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }else {
    return (
      <Card className="h-fit flex justify-center items-center">
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[80vh] py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="Annee" 
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                  // label={{ value: 'Année', position: 'bottom', offset: 0 }}
                />
                <YAxis 
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  label={{ value: 'Nombre de Contrats', angle: -90, position: 'left' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 border rounded-lg shadow-lg">
                          <p className="font-semibold">{`Année: ${label}`}</p>
                          <p className="text-[#65a30d]">{`Productions: ${payload[0].value}`}</p>
                          <p className="text-[#16a34a]">{`Restitutions: ${payload[1].value}`}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => {
                    return value === "Productions" ? "Productions" : "Restitutions"
                  }}
                />
                <Bar 
                  dataKey="Productions" 
                  fill="#65a30d" 
                  radius={[4, 4, 0, 0]} 
                  name="Productions"
                />
                <Bar 
                  dataKey="Restitutions" 
                  fill="#16a34a" 
                  radius={[4, 4, 0, 0]} 
                  name="Restitutions"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>  
      </Card>
    )
  }
}
