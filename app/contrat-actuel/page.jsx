"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

const columns = [
  { field: "client", headerName: "Client", width: 200 },
  { field: "CONTRAT", headerName: "Contrat", width: 130 },
  { field: "ETAT", headerName: "État", width: 130 },
  { field: "DUREE", headerName: "Durée", width: 130 },
  { field: "KM", headerName: "Kilométrage", width: 130 },
  { field: "loyer ht", headerName: "Loyer HT", width: 130 },
  { field: "loyer ttc", headerName: "Loyer TTC", width: 130 },
  { field: "loyer_global", headerName: "Loyer Global", width: 130 },
  { field: "marque modele", headerName: "Marque Modèle", width: 200 },
  { field: "IMMA", headerName: "Immatriculation", width: 130 },
  { field: "VR HT", headerName: "VR HT", width: 130 },
  { field: "ACH_PX_HT", headerName: "Prix Achat HT", width: 130 },
  { field: "ACH_PX_TTC", headerName: "Prix Achat TTC", width: 130 },
  { field: "Date_Debut", headerName: "Date de début", width: 130 },
  { field: "DT ARR Prevue", headerName: "Date Arrivée Prévue", width: 160 },
  { field: "F470DTFINPROL", headerName: "Date Fin Prolongation", width: 160 },
];

export default function PageActuel() {
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

  const fetchData = async (
    page,
    pageSize,
    sortField,
    sortOrder,
    filterItems
  ) => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page + 1,
        pageSize: pageSize,
      });

      // Add sorting parameters if available
      if (sortField && sortOrder) {
        params.append("sortField", sortField);
        params.append("sortOrder", sortOrder);
      }

      // Add filter parameters if available
      if (filterItems && filterItems.length > 0) {
        params.append("filters", JSON.stringify(filterItems));
      }

      // Add client search if available
      if (clientSearch) {
        params.append("clientSearch", clientSearch);
      }

      const response = await fetch(
        `http://localhost:3001/api/contrat_longue_duree?${params.toString()}`
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

  // Fetch all data for export
  const fetchAllData = async () => {
    try {
      setExportLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/contrat_longue_duree?page=1&pageSize=10000${
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
  }, [paginationModel, sortModel, filterModel, clientSearch]); // Refetch when client search changes

  // Handle client search with debounce
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

      // Fetch all data for export
      const exportData = await fetchAllData();

      if (exportData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Prepare data for export
      const formattedData = exportData.map((row) => ({
        Client: row.client,
        Contrat: row.CONTRAT,
        État: row.ETAT,
        Durée: row.DUREE,
        Kilométrage: row.KM,
        "Loyer HT": row["loyer ht"],
        "Loyer TTC": row["loyer ttc"],
        "Loyer Global": row.loyer_global,
        "Marque Modèle": row["marque modele"],
        Immatriculation: row.IMMA,
        "VR HT": row["VR HT"],
        "Prix Achat HT": row.ACH_PX_HT,
        "Prix Achat TTC": row.ACH_PX_TTC,
        "Date de début": row.Date_Debut,
        "Date Arrivée Prévue": row["DT ARR Prevue"],
        "Date Fin Prolongation": row.F470DTFINPROL,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contrats");

      // Save file
      XLSX.writeFile(
        wb,
        `contrats_longue_duree_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Les Contrats de Longue Durée
      </h2>
      <div className="flex justify-between items-center mb-4">
        <div className="w-full sm:w-64">
          <Label htmlFor="client-search" className="mb-2 block">
            Rechercher par client
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="client-search"
              placeholder="Nom du client..."
              value={searchInput}
              onChange={handleClientSearch}
              className="pl-8"
            />
          </div>
        </div>
        <Button
          onClick={exportToExcel}
          className="flex items-center gap-2"
          disabled={exportLoading}
        >
          <FileDown className="h-4 w-4" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>

      {loading && <div className="loader2"></div>}
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={loading}
        pageSizeOptions={[50, 100]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={setPaginationModel}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
      />
    </div>
  );
}
