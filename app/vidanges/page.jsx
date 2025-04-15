"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import frFR from "../frFR";

// Define columns outside the component to prevent recreation on each render
const columns = [
  { field: "F050NOMPRE", headerName: "Client", width: 200 },
  { field: "Matricule", headerName: "Matricule", width: 130 },
  { field: "DATE_DEPART", headerName: "Date Départ", width: 130 },
  { field: "DATE_FIN", headerName: "Date Fin", width: 130 },
  { field: "DERNIER_KM", headerName: "Dernier KM", width: 130 },
  { field: "KM_AFFECTE", headerName: "KM Affecté", width: 130 },
  { field: "MOYENNE_KM_PAR_JOUR", headerName: "Moyenne KM/Jour", width: 150 },
  { field: "dernier_vidange", headerName: "Dernier Vidange", width: 150 },
  { field: "km_dernier_vidange", headerName: "KM Dernier Vidange", width: 150 },
  { field: "NEXT_VIDANGE_KM", headerName: "Prochain Vidange KM", width: 150 },
  { field: "NEXT_VIDANGE_DATE", headerName: "Prochain Vidange Date", width: 150 },
  { field: "JOURS_RESTANTS", headerName: "Jours Restants", width: 130 },
];

export default function VidangesPage() {
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
  const [matriculeSearch, setMatriculeSearch] = useState("");
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [matriculeSearchInput, setMatriculeSearchInput] = useState("");
  const [clientSearchTimeout, setClientSearchTimeout] = useState(null);
  const [matriculeSearchTimeout, setMatriculeSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoize the fetchData function to prevent unnecessary recreations
  const fetchData = useCallback(async (
    page,
    pageSize,
    sortField,
    sortOrder,
    filterItems
  ) => {
    try {
      setLoading(true);
      setError(null);

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

      // Add matricule search if available
      if (matriculeSearch) {
        params.append("matriculeSearch", matriculeSearch);
      }

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log("Fetching data from:", `${process.env.NEXT_PUBLIC_API_URL}/vidange_pro?${params.toString()}`);
      }
      
      // Use AbortController to cancel previous requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vidange_pro?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log("Received data:", data);
      }
      
      setRows(data.items || []);
      setRowCount(data.total || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [clientSearch, matriculeSearch]);

  // Memoize the fetchAllData function
  const fetchAllData = useCallback(async () => {
    try {
      setExportLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vidange_pro?page=1&pageSize=10000${
          clientSearch ? `&clientSearch=${clientSearch}` : ""
        }${
          matriculeSearch ? `&matriculeSearch=${matriculeSearch}` : ""
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
  }, [clientSearch, matriculeSearch]);

  // Memoize the data fetching effect dependencies
  const fetchDataDependencies = useMemo(() => {
    const sortField = sortModel.length > 0 ? sortModel[0].field : null;
    const sortOrder = sortModel.length > 0 ? sortModel[0].sort : null;
    
    return {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortField,
      sortOrder,
      filterItems: filterModel.items
    };
  }, [paginationModel, sortModel, filterModel]);

  // Use the memoized dependencies in the effect
  useEffect(() => {
    fetchData(
      fetchDataDependencies.page,
      fetchDataDependencies.pageSize,
      fetchDataDependencies.sortField,
      fetchDataDependencies.sortOrder,
      fetchDataDependencies.filterItems
    );
  }, [fetchData, fetchDataDependencies]);

  // Handle client search with debounce
  const handleClientSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setClientSearchInput(value); // Update the input value immediately for responsiveness

      // Clear previous timeout
      if (clientSearchTimeout) {
        clearTimeout(clientSearchTimeout);
      }

      // Set searching state to true
      setIsSearching(true);

      // Set new timeout for debounce
      const timeout = setTimeout(() => {
        setClientSearch(value); // Update the actual search value after delay
        setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
        setIsSearching(false);
      }, 750); // Increased debounce time to 1.5 seconds

      setClientSearchTimeout(timeout);
    },
    [clientSearchTimeout]
  );

  // Handle matricule search with debounce
  const handleMatriculeSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setMatriculeSearchInput(value); // Update the input value immediately for responsiveness

      // Clear previous timeout
      if (matriculeSearchTimeout) {
        clearTimeout(matriculeSearchTimeout);
      }

      // Set searching state to true
      setIsSearching(true);

      // Set new timeout for debounce
      const timeout = setTimeout(() => {
        setMatriculeSearch(value); // Update the actual search value after delay
        setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
        setIsSearching(false);
      }, 750); // Increased debounce time to 1.5 seconds

      setMatriculeSearchTimeout(timeout);
    },
    [matriculeSearchTimeout]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (clientSearchTimeout) {
        clearTimeout(clientSearchTimeout);
      }
      if (matriculeSearchTimeout) {
        clearTimeout(matriculeSearchTimeout);
      }
    };
  }, [clientSearchTimeout, matriculeSearchTimeout]);

  // Memoize the export function
  const exportToExcel = useCallback(async () => {
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
        "Client": row.F050NOMPRE,
        "Matricule": row.Matricule,
        "Date Départ": row.DATE_DEPART,
        "Date Fin": row.DATE_FIN,
        "Dernier KM": row.DERNIER_KM,
        "KM Affecté": row.KM_AFFECTE,
        "Moyenne KM/Jour": row.MOYENNE_KM_PAR_JOUR,
        "Dernier Vidange": row.dernier_vidange,
        "KM Dernier Vidange": row.km_dernier_vidange,
        "Prochain Vidange KM": row.NEXT_VIDANGE_KM,
        "Prochain Vidange Date": row.NEXT_VIDANGE_DATE,
        "Jours Restants": row.JOURS_RESTANTS,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vidanges");

      // Save file
      XLSX.writeFile(
        wb,
        `vidanges_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  }, [fetchAllData]);

  // Memoize the DataGrid props to prevent unnecessary re-renders
  const dataGridProps = useMemo(() => ({
    rows,
    columns,
    rowCount,
    loading,
    pageSizeOptions: [25, 50, 100],
    paginationModel,
    paginationMode: "server",
    onPaginationModelChange: setPaginationModel,
    sortingMode: "server",
    sortModel,
    onSortModelChange: setSortModel,
    filterMode: "server",
    filterModel,
    onFilterModelChange: setFilterModel,
    getRowId: (row) => `${row.Matricule}-${row.F050NOMPRE}-${row.DATE_DEPART}`,
    disableRowSelectionOnClick: true,
    localeText: frFR.components.MuiDataGrid.defaultProps.localeText
  }), [rows, rowCount, loading, paginationModel, sortModel, filterModel]);

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Gestion des Vidanges
      </h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Label htmlFor="client-search" className="mb-2 block">
              Rechercher par Client
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-search"
                placeholder="Nom du client..."
                value={clientSearchInput}
                onChange={handleClientSearch}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-full sm:w-64">
            <Label htmlFor="matricule-search" className="mb-2 block">
              Rechercher par Matricule
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="matricule-search"
                placeholder="Matricule..."
                value={matriculeSearchInput}
                onChange={handleMatriculeSearch}
                className="pl-8"
              />
            </div>
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Erreur: {error}</p>
        </div>
      )}

      {loading && <div className="loader2"></div>}
      <div className="h-[75vh] overflow-y-auto">
        <DataGrid {...dataGridProps} />
      </div>
    </div>
  );
}
