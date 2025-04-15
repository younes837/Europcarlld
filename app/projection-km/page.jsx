"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import frFR from "../frFR";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const columns = [
  { field: "Nom_Client", headerName: "Nom Client", width: 200 },
  { field: "Matricule", headerName: "Matricule", width: 130 },
  { field: "DERNIER_KM", headerName: "Dernier KM", width: 130, type: "number" },
  { field: "KM_AFFECTE", headerName: "KM Affecté", width: 130, type: "number" },
  { field: "DATE_DEPART", headerName: "Date Départ", width: 130 },
  { field: "DATE_FIN", headerName: "Date Fin", width: 130 },
  {
    field: "JOURS_DEP_DEP",
    headerName: "Jours Depuis Départ",
    width: 160,
    type: "number",
  },
  {
    field: "JOURS_RESTANTS",
    headerName: "Jours Restants",
    width: 130,
    type: "number",
  },
  {
    field: "KM_PAR_JOUR",
    headerName: "KM par Jour",
    width: 130,
    type: "number",
  },
  {
    field: "KMS_RESTANT",
    headerName: "KMs Restant",
    width: 130,
    type: "number",
  },
  {
    field: "KMS_FIN_CONTRAT",
    headerName: "KMs Fin Contrat",
    width: 150,
    type: "number",
  },
  {
    field: "Depassement",
    headerName: "Dépassement",
    width: 130,
    renderCell: (params) => (
      <div
        className={`px-2 py-1 rounded-full text-sm ${
          params.value === "Dépasse"
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {params.value}
      </div>
    ),
  },
];

export default function ProjectionKm() {
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
  const [depassementFilter, setDepassementFilter] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [filterTimeout, setFilterTimeout] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });

      // Add sorting parameters
      if (sortModel.length > 0) {
        params.append("sortField", sortModel[0].field);
        params.append("sortOrder", sortModel[0].sort);
      }

      // Add filter parameters to the request
      if (filterModel.items.length > 0) {
        // Filter out empty values to prevent unnecessary filtering
        const validFilters = filterModel.items.filter(item => 
          item.value !== undefined && 
          item.value !== null && 
          item.value !== ''
        );
        
        if (validFilters.length > 0) {
          // Convert filter model to a format the backend can understand
          const filterParams = validFilters.map(item => ({
            field: item.field,
            operator: item.operator,
            value: item.value
          }));
          params.append("filters", JSON.stringify(filterParams));
        }
      }

      if (clientSearch) {
        params.append("clientSearch", clientSearch);
      }
      if (matriculeSearch) {
        params.append("matriculeSearch", matriculeSearch);
      }
      if (depassementFilter) {
        params.append("depassementFilter", depassementFilter);
      }

      console.log(
        "Fetching from URL:",
        `${API_URL}/km_project?${params.toString()}`
      );

      const response = await fetch(
        `${API_URL}/km_project?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.items) {
        throw new Error("No items array in response");
      }

      setRows(data.items);
      setRowCount(data.total || data.items.length);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams({
        page: 1,
        pageSize: 10000,
      });

      if (clientSearch) params.append("clientSearch", clientSearch);
      if (matriculeSearch) params.append("matriculeSearch", matriculeSearch);
      if (depassementFilter)
        params.append("depassementFilter", depassementFilter);

      const response = await fetch(
        `${API_URL}/km_project?${params.toString()}`
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error fetching all data:", error);
      setError(error.message);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    paginationModel,
    sortModel,
    clientSearch,
    matriculeSearch,
    depassementFilter,
  ]);

  const handleSearch = useCallback(
    (value, type) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        if (type === "client") {
          setClientSearch(value);
        } else {
          setMatriculeSearch(value);
        }
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 750);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const exportData = await fetchAllData();

      if (exportData.length === 0) {
        console.warn("No data to export");
        return;
      }

      const formattedData = exportData.map((row) => ({
        "Nom Client": row.Nom_Client,
        Matricule: row.Matricule,
        "Dernier KM": row.DERNIER_KM,
        "KM Affecté": row.KM_AFFECTE,
        "Date Départ": row.DATE_DEPART,
        "Date Fin": row.DATE_FIN,
        "Jours Depuis Départ": row.JOURS_DEP_DEP,
        "Jours Restants": row.JOURS_RESTANTS,
        "KM par Jour": row.KM_PAR_JOUR,
        "KMs Restant": row.KMS_RESTANT,
        "KMs Fin Contrat": row.KMS_FIN_CONTRAT,
        Dépassement: row.Depassement,
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Projection KM");

      XLSX.writeFile(
        wb,
        `projection_km_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError(error.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Add a handler for filter model changes with debounce
  const handleFilterModelChange = useCallback(
    (newFilterModel) => {
      // Only set filtering state if there are actual filter values
      const hasValidFilters = newFilterModel.items.some(item => 
        item.value !== undefined && 
        item.value !== null && 
        item.value !== ''
      );
      
      if (hasValidFilters) {
        setIsFiltering(true);
      }
      
      setFilterModel(newFilterModel);
      
      // Clear any existing timeout
      if (filterTimeout) {
        clearTimeout(filterTimeout);
      }
      
      // Set a new timeout to trigger the search after 750ms
      const timeout = setTimeout(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        fetchData();
      }, 750);
      
      setFilterTimeout(timeout);
    },
    [filterTimeout]
  );

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (filterTimeout) {
        clearTimeout(filterTimeout);
      }
    };
  }, [searchTimeout, filterTimeout]);

  return (
    <div className="px-4">
      <div className="flex justify-between items-center">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
          Projection Kilométrique
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
              onChange={(e) => handleSearch(e.target.value, "client")}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <Label htmlFor="matricule-search" className="mb-2">
            Rechercher par Matricule
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="matricule-search"
              placeholder="Matricule..."
              onChange={(e) => handleSearch(e.target.value, "matricule")}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <Label htmlFor="depassement-filter" className="mb-2">
            Filtrer par Dépassement
          </Label>
          <select
            id="depassement-filter"
            value={depassementFilter}
            onChange={(e) => setDepassementFilter(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Tous</option>
            <option value="Dépasse">Dépasse</option>
            <option value="Non Dépasse">Non Dépasse</option>
          </select>
        </div>
      </div>

      {(loading || isFiltering) && <div className="loader2"></div>}
      <div className="h-[75vh] overflow-y-auto">
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading || isFiltering}
          pageSizeOptions={[25, 50, 100]}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={handleFilterModelChange}
          getRowId={(row) => row.Matricule}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          className="bg-white"
        />
      </div>
    </div>
  );
}
