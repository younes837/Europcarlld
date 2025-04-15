"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import frFR from "../frFR";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const columns = [
  { 
    field: "actions", 
    headerName: "Actions", 
    width: 100,
    renderCell: (params) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleViewDetails(params.row)}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
  { field: "CLIENT", headerName: "Client", width: 200 },
  { field: "number_of_vehicles", headerName: "Nombre de Véhicules", width: 160, type: "number" },
  { field: "total_pneu_consommé", headerName: "Total Pneus Consommés", width: 180, type: "number" },
  { field: "total_pneu_dotation", headerName: "Total Pneus Dotation", width: 180, type: "number" },
  { field: "oldest_contract_date", headerName: "Date Contrat Plus Ancien", width: 180 },
  { field: "consommation_moyenne", headerName: "Consommation Moyenne par Véhicule", width: 220, type: "number" },
  { field: "total_montant", headerName: "Total Montant", width: 150, type: "number" },
];

export default function PneumatiquesPage() {
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
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [filterTimeout, setFilterTimeout] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    number_of_vehicles: 0,
    total_pneu_consommé: 0,
    total_pneu_dotation: 0,
    total_montant: 0,
    client_count: 0,
  });

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

      console.log(
        "Fetching from URL:",
        `${API_URL}/total_pneu_client?${params.toString()}`
      );

      const response = await fetch(
        `${API_URL}/total_pneu_client?${params.toString()}`,
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

      // Debug: Log the first few items to check their values
      console.log("Sample data from backend:", data.items.slice(0, 3));
      
      // Use the totals from the backend
      const calculatedTotals = {
        number_of_vehicles: data.totals?.total_vehicles || 0,
        total_pneu_consommé: data.totals?.total_pneus_consommes || 0,
        total_pneu_dotation: data.totals?.total_pneus_dotation || 0,
        total_montant: data.items.reduce((sum, row) => sum + (Number(row.total_montant) || 0), 0),
        client_count: data.total || data.items.length,
      };
      setTotals(calculatedTotals);

      // Debug: Log the calculated totals
      console.log("Calculated totals:", calculatedTotals);

      // Add a totals row at the beginning
      const totalsRow = {
        id: 'totals',
        CLIENT: `Total Clients: ${calculatedTotals.client_count}`,
        number_of_vehicles: calculatedTotals.number_of_vehicles,
        total_pneu_consommé: calculatedTotals.total_pneu_consommé,
        total_pneu_dotation: calculatedTotals.total_pneu_dotation,
        oldest_contract_date: '',
        consommation_moyenne: calculatedTotals.number_of_vehicles > 0 
          ? (calculatedTotals.total_pneu_consommé / calculatedTotals.number_of_vehicles).toFixed(2) 
          : 0,
        total_montant: calculatedTotals.total_montant,
      };

      // Debug: Log the totals row
      console.log("Totals row:", totalsRow);

      setRows([totalsRow, ...data.items]);
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

      const response = await fetch(
        `${API_URL}/total_pneu_client?${params.toString()}`
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
  ]);

  const handleSearch = useCallback(
    (value) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setClientSearch(value);
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

      // Debug: Log the first few items from export data
      console.log("Sample export data:", exportData.slice(0, 3));

      // Calculate totals for export
      const calculatedTotals = {
        number_of_vehicles: exportData.reduce((sum, row) => sum + (Number(row.number_of_vehicles) || 0), 0),
        total_pneu_consommé: exportData.reduce((sum, row) => sum + (Number(row.total_pneu_consommé) || 0), 0),
        total_pneu_dotation: exportData.reduce((sum, row) => sum + (Number(row.total_pneu_dotation) || 0), 0),
        total_montant: exportData.reduce((sum, row) => sum + (Number(row.total_montant) || 0), 0),
        client_count: exportData.length,
      };

      // Debug: Log the calculated totals for export
      console.log("Export calculated totals:", calculatedTotals);

      // Add totals row
      const totalsRow = {
        CLIENT: `Total Clients: ${calculatedTotals.client_count}`,
        "Nombre de Véhicules": calculatedTotals.number_of_vehicles,
        "Total Pneus Consommés": calculatedTotals.total_pneu_consommé,
        "Total Pneus Dotation": calculatedTotals.total_pneu_dotation,
        "Date Contrat Plus Ancien": '',
        "Consommation Moyenne par Véhicule": calculatedTotals.number_of_vehicles > 0 
          ? (calculatedTotals.total_pneu_consommé / calculatedTotals.number_of_vehicles).toFixed(2) 
          : 0,
        "Total Montant": calculatedTotals.total_montant,
      };

      // Debug: Log the totals row for export
      console.log("Export totals row:", totalsRow);

      const formattedData = [totalsRow, ...exportData.map((row) => ({
        Client: row.CLIENT,
        "Nombre de Véhicules": row.number_of_vehicles,
        "Total Pneus Consommés": row.total_pneu_consommé,
        "Total Pneus Dotation": row.total_pneu_dotation,
        "Date Contrat Plus Ancien": row.oldest_contract_date,
        "Consommation Moyenne par Véhicule": row.consommation_moyenne,
        "Total Montant": row.total_montant,
      }))];

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pneumatiques");

      XLSX.writeFile(
        wb,
        `pneumatiques_${new Date().toISOString().split("T")[0]}.xlsx`
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

  const handleViewDetails = (row) => {
    // Implement view details functionality
    console.log("View details for:", row);
    // You can navigate to a details page or open a modal here
  };

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
          Pneumatiques Consommés
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
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
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
          getRowId={(row) => row.id || row.CLIENT}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          className="bg-white"
          getRowClassName={(params) => {
            return params.row.id === 'totals' ? 'bg-yellow-100' : '';
          }}
        />
      </div>
    </div>
  );
}
