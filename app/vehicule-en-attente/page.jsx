"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";

import * as XLSX from "xlsx";

const columns = [
  {
    field: "F570DTDEP",
    headerName: "Date de départ",
    width: 160,
    sortable: true,
  },
  {
    field: "K570030DEP",
    headerName: "Code agence",
    width: 150,
    sortable: true,
  },
  {
    field: "F030LIB",
    headerName: "Agence",
    width: 200,
    sortable: true,
  },
  {
    field: "F091IMMA",
    headerName: "Immatricule",
    width: 150,
    sortable: true,
  },
  {
    field: "F090LIB",
    headerName: "Marque",
    width: 200,
    sortable: true,
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
  const [sortModel, setSortModel] = useState([
    { field: "F091IMMA", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = useState({
    items: [],
  });
  const [searchInput_1, setSearchInput_1] = useState("");
  const [searchInput_2, setSearchInput_2] = useState("");
  const [matriculeSearch, setMatriculeSearch] = useState("");
  const [marqueSearch, setMarqueSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const searchTimeoutRef = useRef(null);

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
        // Enlever les crochets du nom du champ pour le tri
        const cleanSortField = sortField.replace(/[\[\]]/g, "");
        params.append("sortField", cleanSortField);
        params.append("sortOrder", sortOrder);
        console.log("Paramètres de tri:", { cleanSortField, sortOrder });
      }

      // Add filter parameters if available
      if (filterItems && filterItems.length > 0) {
        params.append("filters", JSON.stringify(filterItems));
      }

      // Add client search if available
      if (matriculeSearch) {
        params.append("matriculeSearch", matriculeSearch);
      }

      if (marqueSearch) {
        params.append("marqueSearch", marqueSearch);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vh_disponible?${params.toString()}`
      );
      console.log(
        "URL appelée:",
        `${process.env.NEXT_PUBLIC_API_URL}/vh_disponible?${params.toString()}`
      );
      const responseText = await response.text();
      console.log("Contenu de la réponse:", responseText);

      try {
        const data = JSON.parse(responseText);
        console.log("Données parsées:", data);

        // Utiliser les données de l'API directement
        const items = data.items || [];
        console.log("Items traités:", items);

        setRows(
          items.map((item) => ({
            ...item,
            id: item.id, // L'ID est déjà généré par le backend
          }))
        );
        setRowCount(data.total || 0);
      } catch (parseError) {
        console.error("Erreur lors du parsing JSON:", parseError);
      }
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
        }/vh_disponible?page=1&pageSize=10000${
          matriculeSearch ? `&matriculeSearch=${matriculeSearch}` : ""
        }${marqueSearch ? `&marqueSearch=${marqueSearch}` : ""}`
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
  }, [paginationModel, sortModel, filterModel, matriculeSearch, marqueSearch]); // Refetch when client search changes

  // Handle matricule search with debounce
  const handleMatriculeSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchInput_1(value); // Update the input value immediately for responsiveness

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      setMatriculeSearch(value); // Update the actual search value after delay
      setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
    }, 300); // Reduced debounce time to 300ms for better responsiveness
  }, []);

  // Handle marque search with debounce
  const handleMarqueSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchInput_2(value); // Update the input value immediately for responsiveness

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      setMarqueSearch(value); // Update the actual search value after delay
      setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
    }, 300); // Reduced debounce time to 300ms for better responsiveness
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        "Date de départ": row["F570DTDEP"],
        "Code agence": row["K570030DEP"],
        Agence: row["F030LIB"],
        Immatricule: row["F091IMMA"],
        Marque: row["F090LIB"],
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Véhicules Disponibles");

      // Save file
      XLSX.writeFile(
        wb,
        `vh_disponible_${new Date().toISOString().split("T")[0]}.xlsx`
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
        Les Véhicules en Attente
      </h2>

        <div className="flex justify-between items-center mb-4">
            <div className="flex justify-evenly items-center ">
              <div className="w-full sm:w-64 mx-3">
                <Label htmlFor="client-search" className="mb-2 block">
                  Rechercher par matricule
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client-search"
                    placeholder="matricule..."
                    value={searchInput_1}
                    onChange={handleMatriculeSearch}
                    className="pl-8"
                    />
                </div>
              </div>

              <div className="w-full sm:w-64 mx-3">
                  <Label htmlFor="client-search" className="mb-2 block">
                    Rechercher par marque
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="client-search"
                      placeholder="marque..."
                      value={searchInput_2}
                      onChange={handleMarqueSearch}
                      className="pl-8"
                      />
                  </div>
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
          getRowId={(row) => row.F091IMMA || row.id}
          disableRowSelectionOnClick
          
          
        />
      </div>
    </div>
  );
}
