/* eslint-disable react/prop-types */
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
function Chart ({ data }){
  const sortedData = data.sort((a, b) => b.Parc - a.Parc).slice(0, 20);

  const chartData = {
    labels: sortedData.map((item) => item["Nom client"]),
    datasets: [
      {
        label: "Nombre de Contrats",
        data: sortedData.map((item) => item.Parc),
        backgroundColor: "#46b170",
        borderColor: "rgb(21, 128, 61)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "" },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default Chart;
