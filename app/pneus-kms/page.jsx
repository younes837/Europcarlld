"use client";
import { useState, useEffect, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  MapPin,
  Activity,
  PlusCircle,
  MinusCircle,
  Repeat,
} from "lucide-react";
import * as XLSX from "xlsx";
import CardsLoader from "@/components/Loaders/CardsLoader";
import InputsLoader from "@/components/Loaders/InputsLoader";
import TableLoader from "@/components/Loaders/TableLoader";

const OldPneuData = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(true);
  const [error, setError] = useState(null);
  const [nomClient, setNomClient] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState([
    {
      field: "F400FACDT",
      sort: "desc",
    },
  ]);
  const [exportLoading, setExportLoading] = useState(false);
  const [debouncedNomClient, setDebouncedNomClient] = useState("");

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/old_pneu_kms`;

  // Fonction de debounce
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Fonction de recherche avec debounce
  const handleSearch = useCallback(
    debounce((value) => {
      setDebouncedNomClient(value);
    }, 850),
    []
  );

  const fetchData = async () => {
    setLoading(true);
    setLoading2(false);
    setError(null);

    try {
      const params = new URLSearchParams({
        nom_client: debouncedNomClient.trim() || "",
      });
      
      // Ajouter les paramètres de date si disponibles
      if (startDate) {
        params.append("date_debut", startDate);
      }
      
      if (endDate) {
        params.append("date_fin", endDate);
      }

      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const jsonData = await response.json();
      setData(jsonData);
      setFilteredData(jsonData);
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Échec de la récupération des données. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedNomClient, startDate, endDate]);

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      setFilteredData(data);
      return;
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        setError(
          "La date de début doit être antérieure ou égale à la date de fin."
        );
        return;
      }

      const filtered = data.filter((row) => {
        const date = new Date(row.F400FACDT);
        return date >= start && date <= end;
      });

      setFilteredData(filtered);
    } catch {
      setError("Format de date invalide. Veuillez vérifier vos entrées.");
    }
  };

  useEffect(() => {
    applyDateFilter();
  }, [startDate, endDate, data]);

  // Fonction pour trier les données
  const getSortedData = (data) => {
    if (!sortModel.length) return data;

    const sorted = [...data].sort((a, b) => {
      const field = sortModel[0].field;
      const order = sortModel[0].sort === "asc" ? 1 : -1;

      if (a[field] < b[field]) return -1 * order;
      if (a[field] > b[field]) return 1 * order;
      return 0;
    });

    return sorted;
  };

  // Fonction pour paginer les données
  const getPaginatedData = (data) => {
    if (!data || data.length === 0) return [];
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return data.slice(start, end);
  };

  // Appliquer le tri et la pagination aux données filtrées
  const processedData = getPaginatedData(getSortedData(filteredData)).map(
    (row, index) => ({
      id: row.F470CONTRAT || index,
      ...row,
    })
  );

  // Calculate new statistics
  const totalDuration = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.F470DUREE || 0),
    0
  );
  const averageDuration =
    filteredData.length > 0
      ? (totalDuration / filteredData.length).toFixed(2)
      : "0";

  const moyenneKMAffecte =
    filteredData.length > 0
      ? (
          filteredData.reduce(
            (sum, item) => sum + parseFloat(item.F470KMAFF || 0),
            0
          ) / filteredData.length
        ).toFixed(2)
      : "0";

  const averageDernierKM =
    filteredData.length > 0
      ? (
          filteredData.reduce(
            (sum, item) => sum + parseFloat(item.F090KM || 0),
            0
          ) / filteredData.length
        ).toFixed(2)
      : "0";

  const totalDotationPneu = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.F470NBPNEUS || 0),
    0
  );

  const totalConsomationPneu = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.PNEU_CONSOMME || 0),
    0
  );

  const averagePneuConsomme =
    filteredData.length > 0
      ? (
          filteredData.reduce(
            (sum, item) => sum + parseFloat(item.PNEU_CONSOMME || 0),
            0
          ) / filteredData.length
        ).toFixed(2)
      : "0";

  const columns = [
    { field: "F050NOM", headerName: "Client", width: 150 },
    { field: "F470CONTRAT", headerName: "Contrat", width: 80 },
    { field: "F090LIB", headerName: "Marque", width: 400 },
    { field: "F470DTDEP", headerName: "Date Départ", width: 150 },
    { field: "F470DTARRP", headerName: "Date Arrivée Prv", width: 150 },
    { field: "F470DTARR", headerName: "Date Arrivée Réelle", width: 150 },
    { field: "F470DUREE", headerName: "Durée", width: 50 },
    { field: "F470KMAFF", headerName: "KM Affecté", width: 90 },
    { field: "F090KM", headerName: "Dernier KM", width: 90 },
    { field: "F470NBPNEUS", headerName: "Dotation Pneu", width: 100 },
    { field: "PNEU_CONSOMME", headerName: "Consommation Pneu", width: 100 },
  ];

  // Fonction d'export Excel
  const exportToExcel = async () => {
    try {
      setExportLoading(true);

      const exportData = filteredData.map((row) => ({
        Client: row.F050NOM,
        Contrat: row.F470CONTRAT,
        Marque: row.F090LIB,
        "Date Départ": row.F470DTDEP,
        "Date Arrivée Prv": row.F470DTARRP,
        "Date Arrivée Réelle": row.F470DTARR,
        Durée: row.F470DUREE,
        "KM Affecté": row.F470KMAFF,
        "Dernier KM": row.F090KM,
        "Dotation Pneu": row.F470NBPNEUS,
        "Consommation Pneu": row.PNEU_CONSOMME,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pneus et Kilométrage");

      XLSX.writeFile(
        wb,
        `pneus_kms_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Pneus et Kilométrage
      </h2>
      {loading2 ? (
        <CardsLoader n={6} />
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                    Durée Moyenne
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {averageDuration}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    jours
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
                    Moyenne KM Affecté
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {moyenneKMAffecte}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    km
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
                    Moyenne Dernier KM
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {averageDernierKM}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    km
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
                    Total Dotation Pneu
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <PlusCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {totalDotationPneu}
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
                    Total Consommation Pneu
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <MinusCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {totalConsomationPneu}
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
                    Consommation Moyenne Pneu
                  </div>
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Repeat className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {averagePneuConsomme}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-50 border border-red-200 rounded">
          Erreur: {error}
        </div>
      )}

      {loading2 ? (
        <InputsLoader />
      ) : (
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
                  value={nomClient}
                  onChange={(e) => {
                    setNomClient(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            {/* <div className="w-64">
              <Label htmlFor="date-start" className="mb-2 block">
                Date de début
              </Label>
              <Input
                id="date-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Label htmlFor="date-end" className="mb-2 block">
                Date de fin
              </Label>
              <Input
                id="date-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div> */}
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Rechercher
            </Button>
            <Button
              onClick={exportToExcel}
              className="flex items-center gap-2"
              disabled={exportLoading}
            >
              <FileDown className="h-4 w-4" />
              {exportLoading ? "Exportation..." : "Exporter vers Excel"}
            </Button>
          </div>
        </div>
      )}

      {loading2 ? (
        <TableLoader />
      ) : (
        <div style={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={filteredData.map((row, index) => ({
              id: row.F470CONTRAT || index,
              ...row,
            }))}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 20]}
            sortingMode="client"
            paginationMode="client"
            loading={loading}
            className="bg-white"
          />
        </div>
      )}
    </div>
  );
};

export default OldPneuData;
