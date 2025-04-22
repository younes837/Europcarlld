"use client";
import { DataGrid } from "@mui/x-data-grid";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";

const columns = [
  { field: "NrUnite", headerName: "Nr Unite", width: 130 },
  { field: "MarqueModele", headerName: "Marque/Modele", width: 130 },
  { field: "Matricule", headerName: "Matricule", width: 130 },
  { field: "Marque", headerName: "Marque", width: 130 },
  { field: "DMC", headerName: "DMC", width: 130 },
  { field: "DateVente", headerName: "Date vente", width: 130 },
  { field: "PrixVenteHT", headerName: "Prix de vente HT", width: 130 },
  { field: "PrixAchatHT", headerName: "prix achat HT", width: 130 },
  { field: "DernierKm", headerName: "Dernier Km", width: 130 },
  { field: "VrHT", headerName: "VR HT", width: 130 },
  { field: "Pourcentage", headerName: "%", width: 130 },
];
export default function page() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [rows, setRows] = useState();
  const [rowCount, setRowCount] = useState();
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

  const fetchData = async (
    page,
    pageSize,
    sortField,
    sortOrder,
    filterItems
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page + 1,
        pageSize: pageSize,
      });
      if (sortField && sortOrder) {
        params.append("sortField", sortField);
        params.append("sortOrder", sortOrder);
      }
      if (filterItems && filterItems.length > 0) {
        params.append("filters", JSON.stringify(filterItems));
      }

      // Add date range filters
      if (dateDebut) {
        params.append("dateDebut", dateDebut);
      }
      if (dateFin) {
        params.append("dateFin", dateFin);
      }

      // Add client search if available
      if (clientSearch) {
        params.append("clientSearch", clientSearch);
      }

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
    // Get sorting parameters
    const sortField = sortModel.length > 0 ? sortModel[0].field : null;
    const sortOrder = sortModel.length > 0 ? sortModel[0].sort : null;

    fetchData(
      paginationModel.page,
      paginationModel.pageSize,
      sortField,
      sortOrder,
      filterModel.items
    );
  }, [
    paginationModel,
    sortModel,
    filterModel,
    clientSearch,
    dateDebut,
    dateFin,
  ]);
  useEffect(() => {
    fetchTopModelsAndTotals();
  }, []);
  const handleClientSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value); // Update the input value immediately for responsiveness

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for debounce
      const timeout = setTimeout(() => {
        setClientSearch(value); // Update the actual search value after delay
        setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
      }, 300); // Reduced debounce time to 300ms for better responsiveness

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

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      setExportLoading(true);

      // Fetch all data for export
      const exportData = await fetchAllData();

      if (exportData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Prepare data for export
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

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Véhicules Vendus");

      // Save file
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
          <input
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
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="h-[75vh] overflow-auto">
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
          disableRowSelectionOnClick
          getRowId={(row) => row.NrUnite}
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
