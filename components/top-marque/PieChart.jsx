"use client"

import { useEffect, useState } from "react";
import * as echarts from "echarts";
import SkeletonCard from "./SkeletonCard";
import { Skeleton } from "../ui/skeleton";

function PieChart() {
  const [topClients, setTopClients] = useState([]);
  const [isLoading,setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopClients = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/top_marque");
        const data = await response.json();

        const sortedData = data
          .sort((a, b) => b.Nombre_Contrats - a.Nombre_Contrats)
          .slice(0, 10);
        setTopClients(sortedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }finally{
        setIsLoading(false)
      }
    };

    fetchTopClients();
  }, []);

  useEffect(() => {
    if (!topClients.length) return; // Pas de données → pas de graphique
  
    const chartDom = document.getElementById("myPieChart");
    if (!chartDom) return; // Le div n'existe pas encore
  
    const myChart = echarts.init(chartDom);
  
    const chartData = topClients.map((client) => ({
      value: client.Nombre_Contrats,
      name: client["Marque"],
    }));
  
    const option = {
      title: {
        text: "Top 10 Marque par contrat",
        left: "center",
      },
      tooltip: {
        trigger: "item",
      },
      series: [
        {
          name: "marque",
          type: "pie",
          radius: "50%",
          data: chartData,
          color: [
            '#11261c', '#1a3d2d', '#22573d', '#2c714e', '#38915f',
            '#46b170', '#5dcc85', '#7ae09a', '#9ef4b4', '#c2fbd0', '#e6fff0'
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  
    myChart.setOption(option);
  
    return () => {
      myChart.dispose();
    };
  }, [topClients]);
  
  if (isLoading) {
    return <SkeletonCard/>
  }

  return (
<div className="">
  <div className="bg-white rounded-lg shadow mb-4 h-[400px]">

    <div className="p-4" style={{ height: "410px" }}>
      <div className="pt-4 pb-2">
        <div
          id="myPieChart"
          style={{ height: "400px", width: "100%" }}
        ></div>
      </div>
    </div>
  </div>
</div>

  );
}

export default PieChart;
