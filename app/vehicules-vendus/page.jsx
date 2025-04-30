"use client";
import { DataGrid } from "@mui/x-data-grid";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import frFR from "@/app/frFR";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

const columns = [
  { field: "NrUnite", headerName: "Nr Unite", width: 130 },
  { field: "MarqueModele", headerName: "Marque/Modele", width: 130 },
  { field: "Matricule", headerName: "Matricule", width: 130 },
  { field: "Position", headerName: "Position", width: 130 },
  { field: "Marque", headerName: "Marque", width: 130 },
  { field: "DMC", headerName: "DMC", width: 130 },
  { field: "DateVente", headerName: "Date vente", width: 130 },
  {
    field: "PrixVenteHT",
    headerName: "Prix de vente HT",
    width: 130,
    renderCell: (params) => {
      const value = parseFloat(params.value);
      if (isNaN(value)) return "000";

      const parts = value.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      return <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>;
    },
  },
  {
    field: "PrixAchatHT",
    headerName: "prix achat HT",
    width: 130,
    renderCell: (params) => {
      const value = parseFloat(params.value);
      if (isNaN(value)) return "000";

      const parts = value.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      return <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>;
    },
  },
  {
    field: "DernierKm",
    headerName: "Dernier Km",
    width: 130,
    renderCell: (params) => {
      const value = parseFloat(params.value);
      if (isNaN(value)) return "000";

      const parts = value.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      return <span className="font-bold"> {`${integerPart}`}</span>;
    },
  },
  {
    field: "VrHT",
    headerName: "VR HT",
    width: 130,
    renderCell: (params) => {
      const value = parseFloat(params.value);
      if (isNaN(value)) return "000";

      const parts = value.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      return <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>;
    },
  },
  {
    field: "Pourcentage",
    headerName: "%",
    width: 130,
    renderCell: (params) => {
      const value = parseFloat(params.value);
      if (isNaN(value)) return "000";

      const parts = value.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      return <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>;
    },
  },
];
export default function page() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
  });
  const [clientSearch, setClientSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [topModels, setTopModels] = useState([]);
  const [totals, setTotals] = useState({ prixVenteHT: 0, prixAchatHT: 0 });
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });

      if (sortModel.length > 0) {
        params.append("sortField", sortModel[0].field);
        params.append("sortOrder", sortModel[0].sort);
      }

      if (filterModel.items.length > 0) {
        params.append("filters", JSON.stringify(filterModel.items));
      }

      if (selectedPosition) {
        params.append("position", selectedPosition);
      }

      if (dateDebut) params.append("dateDebut", dateDebut);
      if (dateFin) params.append("dateFin", dateFin);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vo?${params.toString()}`
      );
      const data = await response.json();
      setRows(data.items || []);
      setRowCount(data.total || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setExportLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vo?page=1&pageSize=10000${
          clientSearch ? `&clientSearch=${clientSearch}` : ""
        }`
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

  const fetchTopModelsAndTotals = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vo/stats`
      );
      const data = await response.json();
      setTopModels(data.topModels || []);
      setTotals(data.totals || { prixVenteHT: 0, prixAchatHT: 0 });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, filterModel, selectedPosition, dateDebut, dateFin]);

  useEffect(() => {
    fetchTopModelsAndTotals();
  }, []);

  const handleClientSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setClientSearch(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const exportToExcel = async () => {
    try {
      setExportLoading(true);

      const exportData = await fetchAllData();

      if (exportData.length === 0) {
        console.warn("No data to export");
        return;
      }

      const formattedData = exportData.map((row) => ({
        "Nr Unite": row.NrUnite,
        "Marque/Modele": row.MarqueModele,
        Matricule: row.Matricule,
        Marque: row.Marque,
        DMC: row.DMC,
        "Date vente": row.DateVente,
        "Prix de vente HT": row.PrixVenteHT,
        "Prix achat HT": row.PrixAchatHT,
        "Dernier Km": row.DernierKm,
        "VR HT": row.VrHT,
        "%": row.Pourcentage,
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Véhicules Vendus");

      XLSX.writeFile(
        wb,
        `vehicules_vendus_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
          Les Véhicules Vendus
        </h2>
        <Button
          onClick={exportToExcel}
          className="flex items-center gap-2"
          disabled={exportLoading}
        >
          <FileDown className="h-4 w-4" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Date début
          </label>
          <Input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Date fin
          </label>
          <Input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <Select
            value={selectedPosition}
            onValueChange={(value) => setSelectedPosition(value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les positions" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">Toutes les positions</SelectItem> */}
              <SelectItem value="LCD">LCD</SelectItem>
              <SelectItem value="LLD">LLD</SelectItem>
              <SelectItem value="RL">RL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[75vh] overflow-auto">
        <DataGrid
          rows={rows || []}
          columns={columns}
          rowCount={rowCount || 0}
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
          disableRowSelectionOnClick
          getRowId={(row) => row.NrUnite}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Top 20 Modèles Vendu
          </h3>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Modèle
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                    Nombre de ventes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topModels.map((model, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {model.modele}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      {model.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Totaux</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Prix de vente HT</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.prixVenteHT?.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "MAD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Prix achat HT</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.prixAchatHT?.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "MAD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}