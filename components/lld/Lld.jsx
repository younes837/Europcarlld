"use client";
import { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  DefaultLegendContent,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Loader from "./Loader";

const Lld = ({ isLoading }) => {
  const [chartData, setChartData] = useState(null);
  const [CaData, setCaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("mois");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/ca_annuelle");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (Array.isArray(result)) {
          processData(result, filter);
          setCaData(result);
        } else {
          console.error("Data format unexpected or missing");
          setChartData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    processData(CaData, filter);
  }, [filter]);

  const processData = (data, filter) => {
    let filteredData;

    if (filter === "mois") {
      filteredData = data;
    } else if (filter === "trimestre") {
      filteredData = groupByQuarter(data);
    } else if (filter === "annee") {
      filteredData = groupByYear(data);
    }

    const formattedData = filteredData.map((item) => ({
      name:
        filter === "mois"
          ? `${item.annee}-${String(item.mois).padStart(2, "0")}`
          : item.label,
      value: filter === "mois" ? item.CA : item.value,
      range: [0, filter === "mois" ? item.CA : item.value],
    }));

    setChartData(formattedData);
  };

  const groupByQuarter = (data) => {
    const grouped = {};
    data.forEach(({ annee, mois, CA }) => {
      const quarter = Math.ceil(mois / 3);
      const key = `${annee} T${quarter}`;
      if (!grouped[key]) {
        grouped[key] = { label: key, value: 0 };
      }
      grouped[key].value += CA;
    });
    return Object.values(grouped);
  };

  const groupByYear = (data) => {
    const grouped = {};
    data.forEach(({ annee, CA }) => {
      if (!grouped[annee]) {
        grouped[annee] = { label: `${annee}`, value: 0 };
      }
      grouped[annee].value += CA;
    });
    return Object.values(grouped);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
  };

  const renderTooltipWithoutRange = ({ payload, content, ...rest }) => {
    const newPayload = payload
      .filter((x) => x.dataKey !== "range")
      .map((item) => ({
        ...item,
        name: "Chiffre d'affaire",
        value: formatNumber(item.value),
      }));
    return <Tooltip payload={newPayload} {...rest} />;
  };

  const formatNumber = (num) => {
    const number = Number(num);
    if (isNaN(number)) return "0,00";

    const parts = number.toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${integerPart},${parts[1]}`;
  };

  const renderLegendWithoutRange = ({ payload, content, ...rest }) => {
    const newPayload = payload.filter((x) => x.dataKey !== "range");
    return <DefaultLegendContent payload={newPayload} {...rest} />;
  };

  if (loading && isLoading) return <Loader />;
  if (!chartData || chartData.length === 0)
    return (
      <p className="text-center text-lg font-medium mt-10">
        No chart data available
      </p>
    );

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center mt-10 mb-8">
        Chiffre D'affaires (lld) Par {filter}
      </h1>

      <div className="w-[98%] h-[500px] mt-2">
        <div className="mb-4">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger
              className="w-full sm:w-[200px] rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-green-300"
              aria-label="Filtrer par"
            >
              <SelectValue placeholder="Choisir une période" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="mois">Mois</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="annee">Année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="cursor-pointer" />
            <XAxis dataKey="name" className="cursor-pointer" />
            <YAxis className="cursor-pointer" />
            <Tooltip
              content={renderTooltipWithoutRange}
              className="cursor-pointer"
            />
            <Area
              type="monotone"
              dataKey="range"
              stroke="none"
              fill="#86efac"
              connectNulls
              dot={false}
              activeDot={false}
              className="cursor-pointer"
            />
            <Line
              type="natural"
              dataKey="value"
              stroke="#15803d"
              connectNulls
              className="cursor-pointer"
            />
            <Legend
              content={renderLegendWithoutRange}
              className="cursor-pointer"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Lld;
