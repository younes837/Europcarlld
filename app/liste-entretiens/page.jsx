"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

const columns = [
  { field: "Contrat", headerName: "Contrat", width: 150 },
  { field: "NomClient", headerName: "Nom Client", width: 300 },
  { field: "Immatriculation", headerName: "Immatriculation", width: 150 },
  { field: "marque", headerName: "Marque", width: 300 },
  { field: "MontantHT", headerName: "Montant HT", width: 150, type: "number" },
  { field: "LibelleLigne", headerName: "Libelle Ligne", width: 300 },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ListeEntretiens() {
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
  const [immatriculationSearch, setImmatriculationSearch] = useState("");
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [immatriculationSearchInput, setImmatriculationSearchInput] =
    useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalMontantHT: 0,
    totalEntretiens: 0,
    montantMoyen: 0,
    uniqueMarques: 0,
  });

  const fetchData = async (
    page,
    pageSize,
    sortField,
    sortOrder,
    filterItems
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page + 1,
        pageSize: pageSize,
      });

      if (sortField && sortOrder) {
        params.append("sortField", sortField);
        params.append("sortOrder", sortOrder);
      }

      if (filterItems && filterItems.length > 0) {
        params.append("filters", JSON.stringify(filterItems));
      }

      if (clientSearch) {
        params.append("clientSearch", clientSearch);
      }
      if (immatriculationSearch) {
        params.append("immatriculationSearch", immatriculationSearch);
      }

      const response = await fetch(
        `${API_URL}/list_entretien?${params.toString()}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.items) {
        throw new Error("No items array in response");
      }

      const formattedData = data.items.map((item) => ({
        ...item,
        MontantHT: parseFloat(item.MontantHT),
      }));

      setRows(formattedData);
      setRowCount(data.total || data.items.length);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data for export
  const fetchAllData = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams();
      if (clientSearch) params.append("clientSearch", clientSearch);
      if (immatriculationSearch)
        params.append("immatriculationSearch", immatriculationSearch);

      const response = await fetch(
        `${API_URL}/list_entretien?page=1&pageSize=10000${
          params.toString() ? "&" + params.toString() : ""
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
  }, [
    paginationModel,
    sortModel,
    filterModel,
    clientSearch,
    immatriculationSearch,
  ]);

  // Handle search with debounce
  const handleSearch = useCallback(
    (value, type) => {
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for debounce
      const timeout = setTimeout(() => {
        if (type === "client") {
          setClientSearch(value);
        } else {
          setImmatriculationSearch(value);
        }
        setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

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
        Contrat: row.Contrat,
        "Nom Client": row.NomClient,
        Immatriculation: row.Immatriculation,
        Marque: row.marque,
        "Montant HT": row.MontantHT,
        "Libelle Ligne": row.LibelleLigne,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Entretiens");

      // Save file
      XLSX.writeFile(
        wb,
        `liste_entretiens_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Liste des Entretiens
      </h2>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-blue-600 mb-2">
                Montant Total HT
              </p>
              <div
                title={summary.totalMontantHT.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}
                className="text-2xl font-bold text-blue-900 truncate"
              >
                {summary.totalMontantHT.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}{" "}
                DH
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-green-600 mb-2">
                Nombre D'entretiens
              </p>
              <div
                title={summary.totalEntretiens.toLocaleString("fr-FR")}
                className="text-2xl font-bold text-green-900 truncate"
              >
                {summary.totalEntretiens.toLocaleString("fr-FR")}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-purple-600 mb-2">
                Montant Moyen
              </p>
              <div
                title={summary.montantMoyen.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}
                className="text-2xl font-bold text-purple-900 truncate"
              >
                {summary.montantMoyen.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}{" "}
                DH
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-orange-600 mb-2">
                Marques Uniques
              </p>
              <div
                title={summary.uniqueMarques.toLocaleString("fr-FR")}
                className="text-2xl font-bold text-orange-900 truncate"
              >
                {summary.uniqueMarques.toLocaleString("fr-FR")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-50 border border-red-200 rounded">
          Error: {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <div className="w-64">
            <Label htmlFor="client-search" className="mb-2 block">
              Rechercher par client
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-search"
                placeholder="Nom du client..."
                value={clientSearchInput}
                onChange={(e) => {
                  setClientSearchInput(e.target.value);
                  handleSearch(e.target.value, "client");
                }}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-64">
            <Label htmlFor="immatriculation-search" className="mb-2 block">
              Rechercher par immatriculation
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="immatriculation-search"
                placeholder="Immatriculation..."
                value={immatriculationSearchInput}
                onChange={(e) => {
                  setImmatriculationSearchInput(e.target.value);
                  handleSearch(e.target.value, "immatriculation");
                }}
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
          <FileDown className="h-4 w-4" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>

      {loading && <div className="loader2"></div>}
      <div style={{ height: 600, width: "100%" }}>
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
          className="bg-white"
        />
      </div>
    </div>
  );
}
