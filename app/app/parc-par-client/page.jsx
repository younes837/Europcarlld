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
  { field: "Nom client", headerName: "Nom Client", flex: 1 },
  { field: "LOYER", headerName: "LOYER", flex: 1 ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
}},
  { field: "MARGE", headerName: "MARGE", flex: 1 ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
}},
  { field: "RNL", headerName: "RNL", flex: 1 ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
}},
  { field: "Parc", headerName: "Parc", width: 150 },
];

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/cal_grille_offre?${params.toString()}`
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
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/cal_grille_offre?page=1&pageSize=10000${
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
        "Nom Client": row["Nom client"],
        LOYER: row.LOYER,
        MARGE: row.MARGE,
        RNL: row.RNL,
        Parc: row.Parc,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Parc par Client");

      // Save file
      XLSX.writeFile(
        wb,
        `parc_par_client_${new Date().toISOString().split("T")[0]}.xlsx`
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
        Parc par Client
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
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
        />
      </div>
    </div>
  );
}
