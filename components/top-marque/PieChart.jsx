"use client"

import { useEffect, useState } from "react";
import * as echarts from "echarts";
import SkeletonCard from "./Loader";
import { Skeleton } from "../ui/skeleton";

function PieChart() {
  const [topClients, setTopClients] = useState([]);
  const [isLoading,setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopClients = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/top_marque`);
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
            '#13532c', 
            '#166138',
            '#196f44',
            '#1c7d52',
            '#1f8c61',
            '#229a71',
            '#24a983',
            '#27b796',
            '#29c6aa',
            '#2dd3bf', 
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
