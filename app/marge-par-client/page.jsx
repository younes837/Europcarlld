"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";
import TableLoader from "@/components/Loaders/TableLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const DataTable = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [rowCount, setRowCount] = useState(0);
  const [clientSearch, setClientSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalLoyer: 0,
    totalMarge: 0,
    totalRNL: 0,
    totalParcs: 0,
  });
  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoading2(false);
      const { page, pageSize } = paginationModel;
      const url = new URL(`${API_URL}/marge_client`);

      // Add pagination parameters
      url.searchParams.append("page", page + 1);
      url.searchParams.append("limit", pageSize);

      // Add search parameter if exists
      if (clientSearch) {
        url.searchParams.append("search", clientSearch);
      }

      // Add sorting parameters
      if (sortModel.length > 0) {
        url.searchParams.append("sortField", sortModel[0].field);
        url.searchParams.append("sortOrder", sortModel[0].sort);
      }

      // Add filter parameters
      if (filterModel.items.length > 0) {
        const validFilters = filterModel.items.filter(
          (item) => item.value !== undefined && item.value !== null && item.value !== ''
        );
        if (validFilters.length > 0) {
          url.searchParams.append("filters", JSON.stringify(validFilters));
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Update totals
      if (data.totals) {
        setTotals({
          totalLoyer: data.totals.totalLoyer || 0,
          totalMarge: data.totals.totalMarge || 0,
          totalRNL: data.totals.totalRNL || 0,
          totalParcs: data.totals.totalParcs || 0,
        });
      }

      // Create totals row that will always stay at top
      const totalsRow = {
        id: "totals",
        "Nom client": `Total Clients: ${data.total || 0}`,
        Parc: data.totals?.totalParcs || 0,
        LOYER: data.totals?.totalLoyer || 0,
        MARGE: data.totals?.totalMarge || 0,
        RNL: data.totals?.totalRNL / (data.total || 1),
      };

      // Add unique IDs to data rows if they don't have them
      const dataWithIds = data.data.map((row, index) => ({
        ...row,
        id: row.id || `row-${index}`,
      }));

      // Always keep totals row at the top regardless of sorting
      setRows([totalsRow, ...dataWithIds]);
      setRowCount(data.total);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, clientSearch, sortModel, filterModel]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setClientSearch(searchInput);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 850);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const url = new URL(`${API_URL}/marge_client`);
      url.searchParams.append("export", "true");
      if (clientSearch) {
        url.searchParams.append("search", clientSearch);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.data.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Add totals row for export
      const totalsRow = {
        "Nom client": `Total Clients: ${data.data.length}`,
        Parc: data.totals?.totalParcs || 0,
        LOYER: data.totals?.totalLoyer || 0,
        MARGE: data.totals?.totalMarge || 0,
        RNL: (data.totals?.totalRNL / data.data.length) || 0,
      };

      const ws = XLSX.utils.json_to_sheet([totalsRow, ...data.data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");

      XLSX.writeFile(
        wb,
        `marge_client_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError(error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const columns = [
    { 
      field: "Nom client", 
      headerName: "Nom Client", 
      width: 300,
      filterable: true,
    },
    { 
      field: "Parc", 
      headerName: "Parc", 
      width: 200,
      filterable: true,
      type: 'number',
    },
    {
      field: "LOYER",
      headerName: "LOYER",
      width: 200,
      type: "number",
      filterable: true,
    },
    {
      field: "MARGE",
      headerName: "MARGE",
      width: 200,
      type: "number",
      filterable: true,
    },
    {
      field: "RNL",
      headerName: "RNL %",
      width: 200,
      type: "number",
      filterable: true,
      
    },
  ];

  return (
    <div className="px-4">
      <div className="flex justify-between items-center">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
          Marge par Client
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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          Erreur: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="flex flex-col">
          <Label htmlFor="client-search" className="mb-2">
            Rechercher par Client
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="client-search"
              placeholder="Nom du client..."
              value={searchInput}
              onChange={handleSearchInputChange}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {loading2 ? (
        <TableLoader />
      ) : (
        <div className="h-[75vh] overflow-y-auto">
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            paginationModel={paginationModel}
            paginationMode="server"
            onPaginationModelChange={setPaginationModel}
            rowCount={rowCount}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={(model) => {
              if (model.length > 0 && model[0].field === "totals") return;
              setSortModel(model);
            }}
            filterMode="server"
            filterModel={filterModel}
            onFilterModelChange={(newFilterModel) => {
              // Don't allow filtering on totals row
              const validFilters = newFilterModel.items.filter(
                item => item.field !== "totals"
              );
              setFilterModel({
                ...newFilterModel,
                items: validFilters
              });
              // Reset to first page when filter changes
              setPaginationModel(prev => ({ ...prev, page: 0 }));
            }}
            getRowId={(row) => row.id || row["Nom client"]}
            disableRowSelectionOnClick
            className="bg-white"
            getRowClassName={(params) => {
              return params.row.id === "totals" ? "bg-indigo-100" : "";
            }}
            sortingOrder={["asc", "desc"]}
            disableColumnMenu={false}
            componentsProps={{
              row: {
                style: (params) => ({
                  backgroundColor: params.row.id === "totals" ? "#EEF2FF" : "inherit",
                }),
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
