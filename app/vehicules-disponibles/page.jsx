"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

const columns = [
  {
    field: "date_depart",
    headerName: "Date de départ",
    width: 160,
    sortable: true,
  },
  {
    field: "code_agence",
    headerName: "Code agence",
    width: 150,
    sortable: true,
  },
  {
    field: "agence",
    headerName: "Agence",
    width: 200,
    sortable: true,
  },
  {
    field: "matricule",
    headerName: "Immatriculation",
    width: 150,
    sortable: true,
  },
  {
    field: "marque",
    headerName: "Marque",
    width: 200,
    sortable: true,
  },
];

export default function VehiculesDisponibles() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState([]);
  const [matriculeSearch, setMatriculeSearch] = useState("");
  const [marqueSearch, setMarqueSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });

      if (sortModel.length > 0) {
        params.append("sortField", sortModel[0].field);
        params.append("sortOrder", sortModel[0].sort);
      }

      if (matriculeSearch) {
        params.append("matriculeSearch", matriculeSearch);
      }

      if (marqueSearch) {
        params.append("marqueSearch", marqueSearch);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vh_disponible?${params.toString()}`
      );
      const data = await response.json();

      // Add unique IDs to rows
      const rowsWithIds = (data.items || []).map((row, index) => ({
        ...row,
        uniqueId: `${row.matricule}-${row.code_agence}-${row.date_depart}-${index}`
      }));

      setRows(rowsWithIds);
      setRowCount(data.total || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((value, setter) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setter(value);
      // Reset to first page when searching
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 850); // Increased debounce to 850ms

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, matriculeSearch, marqueSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      
      const params = new URLSearchParams({
        page: 1,
        pageSize: 10000,
        matriculeSearch,
        marqueSearch,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vh_disponible?${params.toString()}`
      );
      const data = await response.json();

      if (!data.items?.length) {
        console.warn("No data to export");
        return;
      }

      const exportData = data.items.map(row => ({
        "Date de départ": row.date_depart,
        "Code agence": row.code_agence,
        "Agence": row.agence,
        "Immatriculation": row.matricule,
        "Marque": row.marque,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Véhicules Disponibles");

      XLSX.writeFile(
        wb,
        `vehicules_disponibles_${new Date().toISOString().split("T")[0]}.xlsx`
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
        Véhicules Disponibles
      </h2>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <div className="w-64">
            <Label htmlFor="matricule-search">Rechercher par immatriculation</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="matricule-search"
                placeholder="Immatriculation..."
                onChange={(e) => handleSearch(e.target.value, setMatriculeSearch)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="w-64">
            <Label htmlFor="marque-search">Rechercher par marque</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="marque-search"
                placeholder="Marque..."
                onChange={(e) => handleSearch(e.target.value, setMarqueSearch)}
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
          getRowId={(row) => row.uniqueId}
          disableRowSelectionOnClick
        />
      </div>
    </div>
  );
}
