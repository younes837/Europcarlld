"use client"

import React, { PureComponent, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";

class CustomizedLabel extends PureComponent {
  render() {
    const { x, y, stroke, value } = this.props;
    return (
      <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle">
        {value}
      </text>
    );
  }
}

class CustomizedAxisTick extends PureComponent {
  render() {
    const { x, y, stroke, payload } = this.props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
          {payload.value}
        </text>
      </g>
    );
  }
}

export function ChartAreaInteractive() {
  const [labels, setLabels] = useState(null);
  const [productions, setProductions] = useState(null);
  const [restitutions, setRestitutions] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/total_contrat`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/restitution_contrat`),
        ]);

        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

        const lab = data1.map(item => `T${item.Trimestre} ${item.Annee}`);
        setLabels(lab);

        setProductions(
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
          name: label,
          productions: data1[index]?.NombreContrats ?? 0,
          restitutions: data2.find(d => `T${d.Trimestre} ${d.Annee}` === label)?.NombreContrats ?? 0,
        }));

        setChartData(dynamicChartData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = chartData.filter((item) => {
    const dateParts = item.name.split(" ");
    const trimester = parseInt(dateParts[0].substring(1));
    const year = parseInt(dateParts[1]);

    const monthMap = { 1: 0, 2: 3, 3: 6, 4: 9 };
    const date = new Date(year, monthMap[trimester]);
    const referenceDate = new Date();

    return date <= referenceDate;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3 justify-center">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[800px]" />
          <Skeleton className="h-4 w-[600px]" />
        </div>
      </div>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Nombre de productions et Restitutions par Trimestre</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total depuis le début jusqu'à aujourd'hui
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div style={{ width: '100%', height: 300 }} >
          <ResponsiveContainer>
            <LineChart
              data={filteredData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" height={60} tick={<CustomizedAxisTick className='cursor-pointer'/>} className='cursor-pointer'/>
              <YAxis className='cursor-pointer'/>
              <Tooltip className='cursor-pointer'/>
              <Legend className='cursor-pointer'/>
              <Line 
                type="monotone" 
                dataKey="productions" 
                stroke="#22c55e" 
                strokeWidth={2}
                label={<CustomizedLabel className='cursor-pointer'/>} 
                className='cursor-pointer'
              />
              <Line 
                type="monotone" 
                dataKey="restitutions" 
                stroke="#f43f5e" 
                strokeWidth={2}
                className='cursor-pointer'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

