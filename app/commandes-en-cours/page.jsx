"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import frFR from "../frFR";

const columns = [
  { field: "NumCommande", headerName: "Num Commande", width: 170 },
  { field: "DateCommande", headerName: "Date De Commande", width: 170 },
  { field: "DateLivraison", headerName: "Date De Livraison", width: 170 },
  { field: "Fournisseur", headerName: "Fournisseur", width: 350 },
  { field: "Marque", headerName: "Marque", width: 350 },
  { field: "MontantHT", headerName: "Mantant HT", width: 170 },
  { field: "MontantTTC", headerName: "Mantant TTC", width: 170 },
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
  const [fournisseurSearch, setFournisseurSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

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

      // Add fournisseur search if available
      if (fournisseurSearch) {
        params.append("clientSearch", fournisseurSearch);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/com_encours?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data)
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
        `${process.env.NEXT_PUBLIC_API_URL}/com_encours?page=1&pageSize=10000${
          fournisseurSearch ? `&clientSearch=${fournisseurSearch}` : ""
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
  }, [paginationModel, sortModel, filterModel, fournisseurSearch]); // Refetch when fournisseur search changes

  // Handle client search with debounce
  const handleFournisseurSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value); // Update the input value immediately for responsiveness

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set searching state to true
      setIsSearching(true);

      // Set new timeout for debounce
      const timeout = setTimeout(() => {
        setFournisseurSearch(value); // Update the actual search value after delay
        setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
        setIsSearching(false);
      }, 1000); // Increased debounce time to 500ms for better performance

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
        "NumCommande": row.NumCommande,
        "DateCommande": row.DateCommande,
        "DateLivraison": row.DateLivraison,
        "Fournisseur": row.Fournisseur,
        "Marque": row.Marque,
        "MontantHT": row.MontantHT,
        "MontantTTC": row.MontantTTC,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Commandes en cours");

      // Save file
      XLSX.writeFile(
        wb,
        `commandes_en_cours_${new Date().toISOString().split("T")[0]}.xlsx`
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
        Les Commandes En Cours
      </h2>
      <div className="flex justify-between items-center mb-4">
        <div className="w-full sm:w-64">
          <Label htmlFor="fournisseur-search" className="mb-2 block">
            Rechercher par Fournisseur
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="fournisseur-search"
              placeholder="Nom du fournisseur..."
              value={searchInput}
              onChange={handleFournisseurSearch}
              className="pl-8"
            />
          </div>
        </div>
        <Button
          onClick={exportToExcel}
          className="flex items-center gap-2 text-black"
          disabled={exportLoading}
        >
          <FileDown className="h-4 w-4 text-black" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>

      {loading && <div className="loader2"></div>}
      <div className="h-[75vh] overflow-y-auto">
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
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        />
      </div>
    </div>
  );
}
