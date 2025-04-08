"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import ContratParClient from "./components/ContratParClient";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

export default function page() {
  const [marcheData, setMarcheData] = useState({
    labels: [],
    datasets: [
      {
        label: "Nombre de Marchés",
        data: [],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  });

  const [loyerData, setLoyerData] = useState({
    labels: [],
    datasets: [
      {
        label: "Loyer HT",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.7)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Loyer TTC",
        data: [],
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  });

  const [metricsData, setMetricsData] = useState({
    labels: [],
    datasets: [
      {
        label: "Durée Moyenne (jours)",
        data: [],
        backgroundColor: "rgba(255, 159, 64, 0.7)",
        borderColor: "rgba(255, 159, 64, 1)",
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        label: "Nombre de Clients",
        data: [],
        backgroundColor: "rgba(153, 102, 255, 0.7)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
        yAxisID: "y1",
      },
    ],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marcheResponse, loyerResponse, dureeResponse, clientResponse] =
          await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/marche_contrat`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyer_marche`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/moyen_duree`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/client_marche`),
          ]);

        const marcheData = await marcheResponse.json();
        const loyerData = await loyerResponse.json();
        const dureeData = await dureeResponse.json();
        const clientData = await clientResponse.json();

        // Transform marche data
        setMarcheData((prevData) => ({
          ...prevData,
          labels: marcheData.map((item) => item.Marche),
          datasets: [
            {
              ...prevData.datasets[0],
              data: marcheData.map((item) => item.Nombre_Marches),
            },
          ],
        }));

        // Transform loyer data
        setLoyerData((prevData) => ({
          ...prevData,
          labels: loyerData.map((item) => item.Marche),
          datasets: [
            {
              ...prevData.datasets[0],
              data: loyerData.map((item) => item.Total_Loyer_HT),
            },
            {
              ...prevData.datasets[1],
              data: loyerData.map((item) => item.Total_Loyer_TTC),
            },
          ],
        }));

        // Transform metrics data
        const markets = dureeData.map((item) => item.Marche);
        setMetricsData((prevData) => ({
          ...prevData,
          labels: markets,
          datasets: [
            {
              ...prevData.datasets[0],
              data: dureeData.map((item) => item.Duree_Moyenne),
            },
            {
              ...prevData.datasets[1],
              data: clientData.map((item) => item.Nombre_Clients),
            },
          ],
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Nombre de Marchés par Type",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Nombre de Marchés",
        },
      },
      x: {
        title: {
          display: true,
          text: "Type de Marché",
        },
      },
    },
  };

  const loyerOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Loyers par Marché",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Montant (€)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Type de Marché",
        },
      },
    },
  };

  const metricsOptions = {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Métriques par Marché",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Durée Moyenne (jours)",
        },
        ticks: {
          precision: 0,
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Nombre de Clients",
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
  };

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Suivi des Marchés
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 w-full max-w-xl mx-auto transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 hover:-translate-y-1">
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Distribution des Marchés
            </h3>
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="h-80 w-full">
                <Bar data={marcheData} options={options} />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 w-full max-w-xl mx-auto transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 hover:-translate-y-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Loyers par Marché
          </h3>
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="h-80">
              <Bar data={loyerData} options={loyerOptions} />
            </div>
          )}
        </Card>

        <Card className="p-6 w-full max-w-xl mx-auto md:col-span-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 hover:-translate-y-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Métriques des Marchés
          </h3>
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="h-80">
              <Bar data={metricsData} options={metricsOptions} />
            </div>
          )}
        </Card>
      </div>
      <ContratParClient />
    </div>
  );
}
