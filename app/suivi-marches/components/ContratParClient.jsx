"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

const columns = [
  { field: "client", headerName: "Client", flex: 1 },
  { field: "nombre_contrats", headerName: "Nombre de Contrats", flex: 1 },
];

export default function ContratParClient() {
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
  const [months, setMonths] = useState(3);

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
        months: months,
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
        }/contrats_par_client?${params.toString()}`
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
  }, [paginationModel, sortModel, filterModel, clientSearch, months]);

  // Handle client search with debounce
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="p-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        Contrats par Client
      </h3>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
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
        <div className="w-full sm:w-48">
          <Label htmlFor="months" className="mb-2 block">
            Période (mois)
          </Label>
          <Input
            id="months"
            type="number"
            min="1"
            value={months}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setMonths(3);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 1) {
                  setMonths(numValue);
                }
              }
            }}
            onBlur={(e) => {
              if (e.target.value === "" || parseInt(e.target.value) < 1) {
                setMonths(3);
              }
            }}
            className="w-full"
          />
        </div>
      </div>

      {loading && <div className="loader2"></div>}
      <div className="h-[50vh] overflow-auto">
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
          getRowId={(row) => row.code_client}
          disableRowSelectionOnClick
        />
      </div>
    </div>
  );
}
