
"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Car,
  DollarSign,
  FileDown,
  Search,
  File,
  Loader2,
  Bug,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Add a global diagnostic function that can be called from the browser console
if (typeof window !== "undefined") {
  window.testSearchApi = async (
    immatricule = "",
    dateDebut = "",
    dateFin = ""
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("pageSize", "10");
      params.append("debug", "true");

      if (immatricule.trim()) params.append("immatricule", immatricule.trim());
      if (dateDebut.trim()) params.append("date_debut", dateDebut.trim());
      if (dateFin.trim()) params.append("date_fin", dateFin.trim());

      console.log(
        `Testing API call with params:`,
        Object.fromEntries(params.entries())
      );

      const url = `${API_URL}/parc_ca?${params.toString()}`;
      console.log("URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          "X-Debug-Mode": "true",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        return { error: `${response.status}: ${errorText}` };
      }

      const data = await response.json();

      // Check if filtering worked
      if (immatricule.trim() && data.items && data.items.length > 0) {
        const matching = data.items.filter(
          (item) =>
            item.F091IMMA &&
            item.F091IMMA.toLowerCase().includes(
              immatricule.trim().toLowerCase()
            )
        );

        console.log(
          `Filtering check: ${matching.length} out of ${data.items.length} items match '${immatricule}'`
        );

        if (matching.length !== data.items.length) {
          console.warn("⚠️ The backend returned unfiltered results!");
        }
      }

      return data;
    } catch (err) {
      console.error("Test API Error:", err);
      return { error: err.message };
    }
  };

  console.info(
    "✅ API diagnostic tool available. Call window.testSearchApi('IMMA123') in console to test."
  );
}

const Page = () => {
  // Basic state
  const [immatricule, setImmatricule] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [summaryStats, setSummaryStats] = useState({
    totalHT: 0,
    totalTTC: 0,
    uniqueVehicles: 0,
    uniqueContracts: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Reset pagination when search parameters change
  useEffect(() => {
    if (hasSearched) {
      setPaginationModel({
        ...paginationModel,
        page: 0,
      });
    }
  }, [immatricule, dateDebut, dateFin]);

  // Table columns definition
  const columns = [
    { field: "id", headerName: "ID", width: 70, hide: true },
    { field: "CONTRAT", headerName: "Contrat", flex: 1, minWidth: 200 },
    { field: "TIERS", headerName: "Tiers", width: 100 },
    { field: "UNITE", headerName: "Unité", width: 100 },
    { field: "F090LIB", headerName: "Marque", width: 180 },
    { field: "N_FACTURE", headerName: "Facture", width: 110 },
    {
      field: "DATE_FAC",
      headerName: "Date Facture",
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return "";
        return new Date(params.value).toLocaleDateString("fr-FR");
      },
    },
    {
      field: "HT",
      headerName: "HT",
      width: 110,
      type: "number"
,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
}
    },
    {
      field: "TTC",
      headerName: "TTC",
      width: 110,
      type: "number",renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
}
    },
    { field: "F091IMMA", headerName: "Immatricule", width: 120 },
  ];

  // Calculate summary stats from data
  const calculateSummary = (items) => {
    const uniqueVehicles = new Set(items.map((item) => item.F091IMMA)).size;
    const uniqueContracts = new Set(items.map((item) => item.CONTRAT)).size;
    const totalHT = items.reduce(
      (sum, item) => sum + (parseFloat(item.HT) || 0),
      0
    );
    const totalTTC = items.reduce(
      (sum, item) => sum + (parseFloat(item.TTC) || 0),
      0
    );

    return {
      totalHT,
      totalTTC,
      uniqueVehicles,
      uniqueContracts,
    };
  };

  // Handle search function
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Build URLSearchParams with pagination
      const params = new URLSearchParams();
      params.append("page", (paginationModel.page + 1).toString());
      params.append("pageSize", paginationModel.pageSize.toString());

      // Add search filters if they have values
      if (immatricule.trim()) {
        // Send the raw immatricule value - the backend handles the LIKE query
        params.append("immatricule", immatricule.trim());
        console.log("Searching for immatricule:", immatricule.trim());
      }

      if (dateDebut.trim()) {
        params.append("date_debut", dateDebut.trim());
        console.log("Searching from date:", dateDebut.trim());
      }

      if (dateFin.trim()) {
        params.append("date_fin", dateFin.trim());
        console.log("Searching to date:", dateFin.trim());
      }

      // Debug the full URL
      const requestUrl = `${API_URL}/parc_ca?${params.toString()}`;
      console.log("Making request to:", requestUrl);

      // Add query debug parameter to see the SQL query in response
      params.append("debug", "true");

      // Use fetch with explicit method and headers
      const response = await fetch(`${API_URL}/parc_ca?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          "X-Debug-Mode": "true", // Add debug header
        },
      });

      if (!response.ok) {
        console.error("Response error:", response.status, response.statusText);

        // Try to get error message from response
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.text();
          console.error("Error response:", errorBody);
          errorMsg += ` - ${errorBody}`;
        } catch (e) {
          console.error("Could not get error details:", e);
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("Received data:", data);

      // Verify the data contains filtered results
      if (immatricule.trim() && data.items && data.items.length > 0) {
        // Check if any results actually match our filter
        const matchingItems = data.items.filter(
          (item) =>
            item.F091IMMA &&
            item.F091IMMA.toLowerCase().includes(
              immatricule.trim().toLowerCase()
            )
        );

        console.log(`Items containing immatricule '${immatricule.trim()}': 
          ${matchingItems.length} out of ${data.items.length} returned items.
          Total records according to response: ${data.total}`);

        if (matchingItems.length === 0 && data.items.length > 0) {
          console.warn(
            "⚠️ WARNING: Received rows don't match the search criteria!"
          );
        }
      }

      if (!data || !Array.isArray(data.items)) {
        console.error("Unexpected data format:", data);
        throw new Error("Format de données incorrect reçu du serveur");
      }

      const items = data.items || [];

      // Add unique IDs to rows if needed
      const rowsWithIds = items.map((item, index) => ({
        ...item,
        id: item.id || index + 1,
      }));

      setRows(rowsWithIds);
      setTotalRows(data.total || 0);
      setSummaryStats(calculateSummary(rowsWithIds));
    } catch (err) {
      console.error("Erreur lors de la recherche:", err);
      setError("Échec de la récupération des données: " + err.message);
      // Clear data on error
      setRows([]);
      setTotalRows(0);
      setSummaryStats({
        totalHT: 0,
        totalTTC: 0,
        uniqueVehicles: 0,
        uniqueContracts: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticTest = () => {
    setLoading(true);
    window
      .testSearchApi(immatricule, dateDebut, dateFin)
      .then((result) => {
        console.log("Diagnostic test result:", result);
        alert(
          `Diagnostic complete. Check browser console for details.\n\nFound ${
            result.items?.length || 0
          } items, total: ${result.total || 0}`
        );
      })
      .catch((err) => {
        console.error("Diagnostic failed:", err);
        alert("Diagnostic failed. Check console for errors.");
      })
      .finally(() => setLoading(false));
  };

  // Handle pagination change
  const handlePaginationChange = (newModel) => {
    setPaginationModel(newModel);
    // Only fetch data if we've already done a search
    if (hasSearched) {
      handleSearch();
    }
  };

  // Handle key press in search fields
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle input change
  const handleImmatriculeChange = (e) => {
    // Convert to uppercase for consistency
    setImmatricule(e.target.value.toUpperCase());
  };

  // Export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      // Get all data for export
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("pageSize", "5000"); // Reasonable limit

      if (immatricule.trim()) {
        params.append("immatricule", encodeURIComponent(immatricule.trim()));
      }

      if (dateDebut.trim()) {
        params.append("date_debut", dateDebut.trim());
      }

      if (dateFin.trim()) {
        params.append("date_fin", dateFin.trim());
      }

      const response = await fetch(`${API_URL}/parc_ca?${params.toString()}`);
      const data = await response.json();

      if (!data || !Array.isArray(data.items)) {
        throw new Error("Format de données incorrect reçu du serveur");
      }

      const exportRows = data.items;

      // Format data for Excel
      const formattedData = exportRows.map((row) => ({
        Contrat: row.CONTRAT,
        Tiers: row.TIERS,
        Unité: row.UNITE,
        Marque: row.F090LIB,
        Facture: row.N_FACTURE,
        "Date Facture": row.DATE_FAC,
        HT: row.HT,
        TTC: row.TTC,
        Immatricule: row.F091IMMA,
      }));

      // Create and download Excel file
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Revenue");

      const fileName = immatricule.trim()
        ? `revenue_par_voiture_${immatricule.trim()}_${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        : `revenue_par_voiture_${new Date().toISOString().split("T")[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Erreur export Excel:", error);
      setError("Échec de l'exportation des données: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Revenue par Voiture
        </h1>
        <p className="text-gray-500">
          Recherche et analyse des revenus par véhicule
        </p>
      </div>

      {/* Summary cards - Always visible at the top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total HT</h3>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="animate-pulse">Chargement...</span>
              ) : (
                summaryStats.totalHT.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              )}{" "}
              <span className="text-sm font-normal text-gray-500">MAD</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total TTC</h3>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="animate-pulse">Chargement...</span>
              ) : (
                summaryStats.totalTTC.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              )}{" "}
              <span className="text-sm font-normal text-gray-500">MAD</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Vehicules</h3>
              <Car className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="animate-pulse">Chargement...</span>
              ) : (
                summaryStats.uniqueVehicles.toLocaleString("fr-FR")
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Contrats</h3>
              <File className="h-4 w-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="animate-pulse">Chargement...</span>
              ) : (
                summaryStats.uniqueContracts.toLocaleString("fr-FR")
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="immatricule">Immatricule</Label>
            <div className="relative mt-1">
              <Search className="absolute top-2.5 left-2 w-4 h-4 text-gray-400" />
              <Input
                id="immatricule"
                value={immatricule}
                onChange={handleImmatriculeChange}
                onKeyPress={handleKeyPress}
                placeholder="Rechercher..."
                className="pl-8 uppercase"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date-debut">Date début</Label>
            <Input
              id="date-debut"
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="date-fin">Date fin</Label>
            <Input
              id="date-fin"
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div className="flex items-end space-x-2">
            <Button
              onClick={handleSearch}
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Rechercher
            </Button>

            <Button
              onClick={handleExport}
              variant="outline"
              disabled={exporting || rows.length === 0}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Data section */}
      <div className="bg-white rounded-lg border">
        {/* Empty state - only shown when no rows and not loading */}
        {rows.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">Aucune donnée</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {hasSearched
                ? "Aucun résultat ne correspond à votre recherche."
                : "Utilisez les filtres ci-dessus pour rechercher des données."}
            </p>
          </div>
        ) : (
          /* Data grid container with fixed height */
          <div style={{ height: 500, position: "relative" }}>
            {/* Loading overlay only covers the DataGrid */}
            {loading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  borderRadius: "0.5rem",
                }}
              >
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <span className="text-sm text-gray-600">
                    Chargement des données...
                  </span>
                </div>
              </div>
            )}

            {/* DataGrid with 100% height of container */}
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationChange}
              paginationMode="server"
              rowCount={totalRows}
              loading={false} /* Use our custom loading overlay */
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              autoHeight={false}
              initialState={{
                sorting: {
                  sortModel: [{ field: "DATE_FAC", sort: "desc" }],
                },
              }}
              sx={{
                height: "100%",
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f9fafb",
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;


