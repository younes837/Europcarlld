"use client";

import { useState, useEffect, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Car, DollarSign, FileDown, Search, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CardsLoader from "@/components/Loaders/CardsLoader";
import InputsLoader from "@/components/Loaders/InputsLoader";
import TableLoader from "@/components/Loaders/TableLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fonction de debounce réutilisable
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Page = () => {
  const [immatricule, setImmatricule] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [totals, setTotals] = useState({
    totalHT: 0,
    totalTTC: 0,
    totalVehicules: 0,
    totalContracts: 0,
  });
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [initialSearch, setInitialSearch] = useState(false);

  // Utiliser le hook de debounce pour chaque champ
  const debouncedImmatricule = useDebounce(immatricule, 850);
  const debouncedDateDebut = useDebounce(dateDebut, 850);
  const debouncedDateFin = useDebounce(dateFin, 850);

  const columns = [
    { field: "CONTRAT", headerName: "Contrat", width: 400 },
    { field: "TIERS", headerName: "Tiers", width: 100 },
    { field: "UNITE", headerName: "Unité", width: 100 },
    { field: "F090LIB", headerName: "Marque", width: 340 },
    { field: "N_FACTURE", headerName: "Facture", width: 110 },
    { field: "DATE_FAC", headerName: "Date Facture", width: 210 },
    { field: "HT", headerName: "HT", width: 100 },
    { field: "TTC", headerName: "TTC", width: 100 },
    { field: "F091IMMA", headerName: "Immatricule", width: 150 },
  ];

  // Effet pour détecter les changements dans les valeurs debouncées
  useEffect(() => {
    // Vérifier si au moins un champ a une valeur
    if (debouncedImmatricule || debouncedDateDebut || debouncedDateFin) {
      setInitialSearch(true);
      fetchData();
    }
  }, [
    debouncedImmatricule,
    debouncedDateDebut,
    debouncedDateFin,
    paginationModel,
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        pageSize: paginationModel.pageSize.toString(),
      });

      if (debouncedImmatricule.trim()) {
        params.append("immatricule", debouncedImmatricule.trim());
      }

      // Allow specifying either one or both dates
      if (debouncedDateDebut.trim()) {
        params.append("date_debut", debouncedDateDebut.trim());
      }

      if (debouncedDateFin.trim()) {
        params.append("date_fin", debouncedDateFin.trim());
      }

      const response = await fetch(`${API_URL}/parc_ca?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData) {
        setRows(responseData.items || []);
        setTotalRows(responseData.total || 0);
        setTotals({
          totalHT: responseData.summary.totalHT || 0,
          totalTTC: responseData.summary.totalTTC || 0,
          totalVehicules: responseData.summary.uniqueVehiclesCount || 0,
          totalContracts: responseData.summary.totalContracts || 0,
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Échec de la récupération des données.");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedImmatricule,
    debouncedDateDebut,
    debouncedDateFin,
    paginationModel,
  ]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Obtenir toutes les données pour l'export
      const params = new URLSearchParams({
        page: 1,
        pageSize: totalRows, // Grand nombre pour obtenir toutes les données
      });

      if (immatricule.trim()) {
        params.append("immatricule", immatricule.trim());
      }

      // Allow specifying either one or both dates for export too
      if (dateDebut.trim()) {
        params.append("date_debut", dateDebut.trim());
      }

      if (dateFin.trim()) {
        params.append("date_fin", dateFin.trim());
      }

      const response = await fetch(`${API_URL}/parc_ca?${params.toString()}`);
      const data = await response.json();
      const exportRows = data.items || [];

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

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Revenue");
      XLSX.writeFile(
        wb,
        `revenue_par_voiture_${immatricule || "tous"}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );
    } catch (error) {
      console.error("Erreur export Excel :", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
          Revenue par Voiture - {immatricule || "..."}
        </h2>
      </div>

      {loading2 ? (
        <CardsLoader n={4} />
      ) : (
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                    Total HT
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {totals.totalHT.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    MAD
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                    Total TTC
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {totals.totalTTC.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    MAD
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                    Nombre de Contrats
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <File className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {totals.totalContracts.toLocaleString("fr-FR")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                    Véhicules Uniques
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {totals.totalVehicules.toLocaleString("fr-FR")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading2 ? (
        <InputsLoader />
      ) : (
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 items-center">
            <div className="w-full sm:w-64">
              <Label htmlFor="search">Immatricule</Label>
              <div className="relative mt-1">
                <Search className="absolute top-2.5 left-2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={immatricule}
                  onChange={(e) => setImmatricule(e.target.value)}
                  placeholder="Ex: 1234-ABC"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="w-full sm:w-64">
              <Label htmlFor="date-start">Date début</Label>
              <Input
                className={"mt-1"}
                id="date-start"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-64">
              <Label htmlFor="date-end">Date fin</Label>
              <Input
                className={"mt-1"}
                id="date-end"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleExport}
            className="flex items-center gap-2"
            disabled={exporting || rows.length === 0}
          >
            <FileDown className="w-4 h-4" />
            {exporting ? "Exportation..." : "Exporter vers Excel"}
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-50 border border-red-200 rounded">
          Erreur: {error}
        </div>
      )}

      {!initialSearch &&
      !debouncedImmatricule &&
      !debouncedDateDebut &&
      !debouncedDateFin ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Search className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Aucune donnée à afficher</h3>
          <p className="text-muted-foreground max-w-md">
            Veuillez entrer un immatricule ou une période de dates pour
            rechercher les données.
          </p>
        </div>
      ) : loading ? (
        <TableLoader />
      ) : (
        <div className="h-[75vh]">
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 20, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            rowCount={totalRows}
            loading={loading}
            className="bg-white"
          />
        </div>
      )}
    </div>
  );
};

export default Page;
