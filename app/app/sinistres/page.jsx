"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import frFR from "../frFR";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Function to get first and last day of current month
const getCurrentMonthDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    first: firstDay.toISOString().split('T')[0],
    last: lastDay.toISOString().split('T')[0]
  };
};

const columns = [
  { field: "Num_Sinistre", headerName: "Num Sinistre", width: 130 },
  { field: "Date_Sinistre", headerName: "Date de Sinistre", width: 130 },
  { field: "Sinistre_DT_Saisie", headerName: "Date de saisie", width: 130 },
  { field: "Matricule", headerName: "Matricule", width: 130 },
  { field: "Marque", headerName: "Marque", width: 130 },
  { field: "Client", headerName: "Nom Client", width: 200 },
  { field: "Expert", headerName: "Expert", width: 130 },
  { field: "Ville", headerName: "Lieu", width: 130 },
  { field: "Nature_op", headerName: "Nature de sinistre", width: 150 },
  { field: "Type_Acc", headerName: "Type acc", width: 130 },
  { field: "Nm_Fact", headerName: "Numero de facture", width: 150 },
  { field: "Valeur_Devis", headerName: "Valeur devis", width: 130, type: 'number' ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
} },
  { field: "Type", headerName: "Type", width: 130 }
];

export default function SinistresPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
  });
  const [clientSearch, setClientSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const [dateAfter, setDateAfter] = useState(getCurrentMonthDates().first);
  const [dateBefore, setDateBefore] = useState(getCurrentMonthDates().last);
  const [debouncedDateAfter, setDebouncedDateAfter] = useState(getCurrentMonthDates().first);
  const [debouncedDateBefore, setDebouncedDateBefore] = useState(getCurrentMonthDates().last);

  const [typeAccData, setTypeAccData] = useState({
    labels: [],
    datasets: [
      {
        label: "Nombre de Sinistres par Type",
        data: [],
        backgroundColor: [
          'rgba(52, 211, 153, 0.7)',  // green for Non Responsable
          'rgba(239, 68, 68, 0.7)',   // red for Responsable
          'rgba(249, 115, 22, 0.7)',  // orange for Partage de Responsabilité
        ],
        borderColor: [
          'rgb(52, 211, 153)',
          'rgb(239, 68, 68)',
          'rgb(249, 115, 22)',
        ],
        borderWidth: 1,
      },
    ],
  });

  const [natureData, setNatureData] = useState({
    labels: [],
    datasets: [
      {
        label: "Nombre de Sinistres par Nature",
        data: [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',   // indigo
          'rgba(236, 72, 153, 0.7)',   // pink
          'rgba(139, 92, 246, 0.7)',   // purple
          'rgba(14, 165, 233, 0.7)',   // sky
          'rgba(168, 85, 247, 0.7)',   // violet
          'rgba(251, 146, 60, 0.7)',   // orange
          'rgba(34, 197, 94, 0.7)',    // green
          'rgba(59, 130, 246, 0.7)',   // blue
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(236, 72, 153)',
          'rgb(139, 92, 246)',
          'rgb(14, 165, 233)',
          'rgb(168, 85, 247)',
          'rgb(251, 146, 60)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 1,
      },
    ],
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        includeStats: true, // New parameter to request stats with the main data
      });

      // Add sorting parameters if available
      if (sortModel.length > 0) {
        params.append("sortField", sortModel[0].field);
        params.append("sortOrder", sortModel[0].sort);
      }

      // Add filter parameters if available
      if (filterModel.items.length > 0) {
        params.append("filters", JSON.stringify(filterModel.items));
      }

      // Add client search if available
      if (debouncedClientSearch) {
        params.append("clientSearch", debouncedClientSearch);
      }

      // Add type filter if available
      if (typeFilter) {
        params.append("typeFilter", typeFilter);
      }

      // Add date filters if available
      if (debouncedDateAfter) {
        params.append("dateAfter", debouncedDateAfter);
      }
      if (debouncedDateBefore) {
        params.append("dateBefore", debouncedDateBefore);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charge_sinistre?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update table data
      setRows(data.items || []);
      setRowCount(data.total || 0);

      // Update chart data if stats are included
      if (data.stats) {
        // Update Type_Acc chart data
        if (data.stats.typeAccStats) {
          setTypeAccData(prev => ({
            ...prev,
            labels: data.stats.typeAccStats.map(item => item.Type_Acc),
            datasets: [{
              ...prev.datasets[0],
              data: data.stats.typeAccStats.map(item => item.count)
            }]
          }));
        }

        // Update Nature_op chart data
        if (data.stats.natureStats) {
          setNatureData(prev => ({
            ...prev,
            labels: data.stats.natureStats.map(item => item.Nature_op),
            datasets: [{
              ...prev.datasets[0],
              data: data.stats.natureStats.map(item => item.count)
            }]
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data for export
  const fetchAllData = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams({
        page: 1,
        pageSize: 10000, // Large number to get all records
      });

      if (debouncedClientSearch) params.append("clientSearch", debouncedClientSearch);
      if (debouncedDateAfter) params.append("dateAfter", debouncedDateAfter);
      if (debouncedDateBefore) params.append("dateBefore", debouncedDateBefore);
      if (filterModel.items.length > 0) {
        params.append("filters", JSON.stringify(filterModel.items));
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/charge_sinistre?${params.toString()}`
      );
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error fetching all data:", error);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    sortModel,
    filterModel,
    debouncedClientSearch,
    debouncedDateAfter,
    debouncedDateBefore,
    typeFilter
  ]);

  // Handle client search with debounce
  const handleClientSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setDebouncedClientSearch(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 500);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Handle date after with debounce
  const handleDateAfterChange = useCallback(
    (e) => {
      const value = e.target.value;
      setDateAfter(value);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setDebouncedDateAfter(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 500);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Handle date before with debounce
  const handleDateBeforeChange = useCallback(
    (e) => {
      const value = e.target.value;
      setDateBefore(value);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setDebouncedDateBefore(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 500);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const exportData = await fetchAllData();

      if (exportData.length === 0) {
        console.warn("No data to export");
        return;
      }

      const formattedData = exportData.map((row) => ({
        "Num Sinistre": row.Num_Sinistre,
        "Date Sinistre": row.Date_Sinistre,
        "Date de saisie": row.Sinistre_DT_Saisie,
        "Matricule": row.Matricule,
        "Marque": row.Marque,
        "Client": row.Client,
        "Expert": row.Expert,
        "Ville": row.Ville,
        "Nature de sinistre": row.Nature_op,
        "Type acc": row.Type_Acc,
        "Numero de facture": row.Nm_Fact,
        "Valeur devis": row.Valeur_Devis,
        "Type": row.Type,
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sinistres");

      XLSX.writeFile(
        wb,
        `sinistres_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        display: true,
        labels: {
          padding: 20,
          font: {
            size: 12
          },
          usePointStyle: true,
          boxWidth: 10
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const typeAccOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: "Distribution par Type d'Accident",
        font: {
          size: 16,
        },
      },
      legend: {
        ...chartOptions.plugins.legend,
        labels: {
          ...chartOptions.plugins.legend.labels,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => ({
              text: `${label} (${datasets[0].data[i]})`,
              fillStyle: datasets[0].backgroundColor[i],
              strokeStyle: datasets[0].borderColor[i],
              lineWidth: 1,
              hidden: false,
              index: i
            }));
          }
        }
      }
    },
  };

  const natureOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: "Distribution par Nature de Sinistre",
        font: {
          size: 16,
        },
      },
      legend: {
        ...chartOptions.plugins.legend,
        labels: {
          ...chartOptions.plugins.legend.labels,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => ({
              text: `${label} (${datasets[0].data[i]})`,
              fillStyle: datasets[0].backgroundColor[i],
              strokeStyle: datasets[0].borderColor[i],
              lineWidth: 1,
              hidden: false,
              index: i
            }));
          }
        }
      }
    },
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
          Les Sinistres
        </h2>
        <Button
          onClick={exportToExcel}
          className="flex items-center gap-2 text-black"
          disabled={exportLoading}
        >
          <FileDown className="h-4 w-4" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Rechercher par Client
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Nom du client..."
              value={searchInput}
              onChange={handleClientSearch}
              className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Tous</option>
            <option value="Non Responsable">Non Responsable</option>
            <option value="Responsable">Responsable</option>
            <option value="Partage de Responsabilité">Partage de Responsabilité</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Date début
          </label>
          <input
            type="date"
            value={dateAfter}
            onChange={handleDateAfterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Date fin
          </label>
          <input
            type="date"
            value={dateBefore}
            onChange={handleDateBeforeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading && <div className="loader2"></div>}
      <div className="h-[75vh] overflow-y-auto mb-6">
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          getRowId={(row) => row.Num_Sinistre}
          disableRowSelectionOnClick
          getRowClassName={(params) => {
            switch(params.row.Type_Acc) {
              case 'Non Responsable':
                return 'text-green-600';
              case 'Responsable':
                return 'text-red-600';
              case 'Partage de Responsabilité':
                return 'text-orange-500';
              default:
                return '';
            }
          }}
          sx={{
            '& .MuiDataGrid-row': {
              '&.text-green-600': {
                color: 'rgb(22 163 74)',
              },
              '&.text-red-600': {
                color: 'rgb(220 38 38)',
              },
              '&.text-orange-500': {
                color: 'rgb(249 115 22)',
              },
            },
          }}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 w-full max-w-xl mx-auto transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 hover:-translate-y-1">
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Distribution par Type d'Accident
            </h3>
            <div className="h-[500px] w-full">
              <Bar data={typeAccData} options={{
                ...typeAccOptions,
                maintainAspectRatio: false,
                responsive: true
              }} />
            </div>
          </div>
        </Card>

        <Card className="p-6 w-full max-w-xl mx-auto transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 hover:-translate-y-1">
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Distribution par Nature de Sinistre
            </h3>
            <div className="h-[500px] w-full">
              <Bar data={natureData} options={{
                ...natureOptions,
                maintainAspectRatio: false,
                responsive: true
              }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
