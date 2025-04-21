"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

const columns = [
  { field: "Unite", headerName: "Unite", width: 100 },
  { field: "MARQUE", headerName: "Marque", width: 120 },
  { field: "modele", headerName: "Modèle", width: 220 },
  { field: "F090SERIE", headerName: "Numéro de Série", width: 170 },
  { field: "F090KM", headerName: "Kilométrage", width: 120, type: "number" },
  { 
    field: "DMC", 
    headerName: "Date de mise en circulation", 
    width: 200,
  },
  { 
    field: "DATE ENTREE", 
    headerName: "Date d'entrée", 
    width: 150,
  },
  { field: "K090T07TYP", headerName: "Type", width: 100 },
  { field: "Position", headerName: "Position", width: 120 },
  { field: "ORGANISME", headerName: "Organisme", width: 150 },
  { 
    field: "achat_prix_ht", 
    headerName: "Prix d'achat HT", 
    width: 150,
    type: "number",
  },
];

export default function Page() {
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
  const [marqueSearch, setMarqueSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [position, setPosition] = useState("");
  const [positions, setPositions] = useState([
    { value: "", label: "Toutes les positions" },
  ]);
  const [error, setError] = useState(null);
  
  // Fetch positions from the backend
  const fetchPositions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/positions`
      );
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        setPositions([
          { value: "", label: "Toutes les positions" },
          ...data.items
        ]);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
      // Fallback to default positions if API fails
      setPositions([
        { value: "", label: "Toutes les positions" },
        { value: "LCD", label: "LCD" },
        { value: "LMD", label: "LMD" },
        { value: "LCD-FLEX", label: "LCD-FLEX" },
        { value: "LLD", label: "LLD" },
      ]);
    }
  };

  // Load positions on initial render
  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });

      // Add sorting parameters if available
      if (sortModel.length > 0) {
        params.append("sortField", sortModel[0].field);
        params.append("sortOrder", sortModel[0].sort);
      }

      // Add filter parameters if available
      if (filterModel.items.length > 0) {
        params.append("filters", JSON.stringify(filterModel.items));
      }

      // Add date filters
      if (dateDebut) {
        params.append("dateDebut", dateDebut);
      }
      if (dateFin) {
        params.append("dateFin", dateFin);
      }

      // Add marque search if available
      if (marqueSearch) {
        params.append("marqueSearch", marqueSearch);
      }

      // Add position filter
      if (position) {
        params.append("position", position);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/achats_vh?${params.toString()}`
      );
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Check if data has expected structure
      if (!data || !Array.isArray(data.items)) {
        console.error("Unexpected data format:", data);
        setRows([]);
        setRowCount(0);
        setError("Format de données inattendu. Veuillez contacter l'administrateur.");
        return;
      }
      
      setRows(data.items || []);
      setRowCount(data.total || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRows([]);
      setRowCount(0);
      setError(`Erreur lors de la récupération des données: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, filterModel, marqueSearch, dateDebut, dateFin, position]);

  // Fetch all data for export
  const fetchAllData = async () => {
    try {
      setExportLoading(true);
      setError(null);
      
      // Build query parameters for exporting all data
      const params = new URLSearchParams({
        page: 1,
        pageSize: 10000, // Large page size to get all data
      });
      
      // Add filters
      if (marqueSearch) {
        params.append("marqueSearch", marqueSearch);
      }
      if (dateDebut) {
        params.append("dateDebut", dateDebut);
      }
      if (dateFin) {
        params.append("dateFin", dateFin);
      }
      if (position) {
        params.append("position", position);
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/achats_vh?${params.toString()}`
      );
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Check if data has expected structure
      if (!data || !Array.isArray(data.items)) {
        console.error("Unexpected data format:", data);
        setError("Format de données inattendu pour l'exportation.");
        return [];
      }
      
      return data.items || [];
    } catch (error) {
      console.error("Error fetching all data:", error);
      setError(`Erreur lors de l'exportation: ${error.message}`);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarqueSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value); // Update the input value immediately for responsiveness

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for debounce
      const timeout = setTimeout(() => {
        setMarqueSearch(value); // Update the actual search value after delay
        setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
      }, 300); // Debounce time of 300ms

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

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      // Fetch all data for export
      const exportData = await fetchAllData();

      if (exportData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Prepare data for export - format dates and numbers
      const formattedData = exportData.map((row) => ({
        "Unite": row.Unite,
        "Marque": row.MARQUE,
        "Modèle": row.modele,
        "Numéro de Série": row.F090SERIE,
        "Kilométrage": row.F090KM,
        "Date de mise en circulation": row.DMC ? new Date(row.DMC).toLocaleDateString() : "",
        "Date d'entrée": row["DATE ENTREE"] ? new Date(row["DATE ENTREE"]).toLocaleDateString() : "",
        "Type": row.K090T07TYP,
        "Position": row.Position,
        "Organisme": row.ORGANISME,
        "Prix d'achat HT": row.achat_prix_ht,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Véhicules Achetés");

      // Save file
      XLSX.writeFile(
        wb,
        `vehicules_achetes_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError(`Erreur lors de l'exportation Excel: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Handle date changes
  const handleDateDebutChange = (e) => {
    setDateDebut(e.target.value);
    setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleDateFinChange = (e) => {
    setDateFin(e.target.value);
    setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
  };

  // Handle position change
  const handlePositionChange = (e) => {
    setPosition(e.target.value);
    setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
  };

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Véhicules Achetés
      </h2>
      
      <div className="flex flex-wrap gap-4 justify-between items-end mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search field */}
          <div>
            <Label htmlFor="marque-search" className="mb-2 block">
              Rechercher par marque/modèle
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="marque-search"
                placeholder="Marque ou modèle..."
                value={searchInput}
                onChange={handleMarqueSearch}
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Date range filters */}
          <div>
            <Label htmlFor="date-debut" className="mb-2 block">
              Date début
            </Label>
            <Input
              id="date-debut"
              type="date"
              value={dateDebut}
              onChange={handleDateDebutChange}
            />
          </div>
          
          <div>
            <Label htmlFor="date-fin" className="mb-2 block">
              Date fin
            </Label>
            <Input
              id="date-fin"
              type="date"
              value={dateFin}
              onChange={handleDateFinChange}
            />
          </div>
          
          {/* Position selector */}
          <div>
            <Label htmlFor="position-select" className="mb-2 block">
              Position
            </Label>
            <select
              id="position-select"
              value={position}
              onChange={handlePositionChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {positions.map(pos => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Export button */}
        <Button
          onClick={exportToExcel}
          className="flex items-center gap-2"
          disabled={exportLoading}
        >
          <FileDown className="h-4 w-4" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {loading && <div className="loader2"></div>}
      <div className="h-[75vh] w-full" style={{ minHeight: "500px" }}>
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
          getRowId={(row) => row.Unite || `row-${Math.random()}`}
          disableRowSelectionOnClick
          sx={{ 
            height: '100%',
            width: '100%',
            '& .MuiDataGrid-main': { 
              // Add any additional styling here
            }
          }}
        />
      </div>
    </div>
  );
}
