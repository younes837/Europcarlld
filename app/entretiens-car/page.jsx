"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Car, DollarSign, FileDown, Search, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";
import CardsLoader from "@/components/Loaders/CardsLoader";
import InputsLoader from "@/components/Loaders/InputsLoader";
import TableLoader from "@/components/Loaders/TableLoader";

const columns = [
  { field: "F091IMMA", headerName: "Immatriculation", width: 150 },
  { field: "F090LIB", headerName: "Marque", width: 200 },
  { field: "F400NMDOC", headerName: "Document", width: 150 },
  { field: "F410MTHT", headerName: "Montant HT", width: 130 },
  { field: "K410100PRO", headerName: "Code Produit", width: 150 },
  { field: "F410LIB", headerName: "Libellé", width: 200 },
  { field: "F400FACDT", headerName: "Date Facture", width: 150 },
  { field: "F050NOM", headerName: "Nom Client", width: 200 },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EntretienMatricule() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [matricule, setMatricule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [summary, setSummary] = useState({
    totalMontant: 0,
    totalEntretiens: 0,
    montantMoyen: 0,
    uniqueVehiclesCount: 0,
  });
  const [debouncedMatricule, setDebouncedMatricule] = useState("");
  const [debouncedStartDate, setDebouncedStartDate] = useState("");
  const [debouncedEndDate, setDebouncedEndDate] = useState("");

  // Fonction de debounce
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Mise à jour des valeurs debounced
  useEffect(() => {
    const debouncedUpdate = debounce((value) => {
      setDebouncedMatricule(value);
    }, 500);
    debouncedUpdate(matricule);
  }, [matricule]);

  useEffect(() => {
    const debouncedUpdate = debounce((value) => {
      setDebouncedStartDate(value);
    }, 500);
    debouncedUpdate(startDate);
  }, [startDate]);

  useEffect(() => {
    const debouncedUpdate = debounce((value) => {
      setDebouncedEndDate(value);
    }, 500);
    debouncedUpdate(endDate);
  }, [endDate]);

  // Recherche automatique lorsque les valeurs debounced changent
  useEffect(() => {
    fetchData();
  }, [debouncedMatricule, debouncedStartDate, debouncedEndDate, paginationModel]);

  // Chargement initial des données
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setLoading2(false);
      try {
        const params = new URLSearchParams({
          page: (paginationModel.page + 1).toString(),
          pageSize: paginationModel.pageSize.toString(),
        });

        const response = await fetch(
          `${API_URL}/entretien_matricule?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        if (responseData) {
          setData(responseData.items || []);
          setFilteredData(responseData.items || []);
          setTotalRows(responseData.total || 0);
          setSummary(
            responseData.summary || {
              totalMontant: 0,
              totalEntretiens: 0,
              montantMoyen: 0,
              uniqueVehiclesCount: 0,
            }
          );
        }
      } catch (err) {
        console.error("Erreur lors du chargement initial:", err);
        setError("Échec du chargement initial des données.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [paginationModel.page, paginationModel.pageSize]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        pageSize: paginationModel.pageSize.toString(),
      });

      if (debouncedMatricule.trim()) {
        params.append('matricule', debouncedMatricule);
      }
      if (debouncedStartDate.trim()) {
        params.append('dateDebut', debouncedStartDate);
      }
      if (debouncedEndDate.trim()) {
        params.append('dateFin', debouncedEndDate);
      }

      const response = await fetch(
        `${API_URL}/entretien_matricule?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData) {
        setData(responseData.items || []);
        setFilteredData(responseData.items || []);
        setTotalRows(responseData.total || 0);
        setSummary(
          responseData.summary || {
            totalMontant: 0,
            totalEntretiens: 0,
            montantMoyen: 0,
            uniqueVehiclesCount: 0,
          }
        );
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Échec de la récupération des données.");
    } finally {
      setLoading(false);
    }
  }, [debouncedMatricule, debouncedStartDate, debouncedEndDate, paginationModel]);

  // Optimisation du filtrage des dates avec useMemo
  const filteredDataMemo = useMemo(() => {
    let filtered = data;

    // Filtrer par matricule si rempli
    if (matricule.trim()) {
      filtered = filtered.filter(row => 
        row.F091IMMA.toLowerCase().includes(matricule.toLowerCase())
      );
    }

    // Filtrer par dates si remplies
    if (startDate.trim() && endDate.trim()) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        setError("La date de début doit être antérieure à la date de fin.");
        return data;
      }

      filtered = filtered.filter(row => {
        const date = new Date(row.F400FACDT);
        return date >= start && date <= end;
      });
    }

    return filtered;
  }, [matricule, startDate, endDate, data]);

  useEffect(() => {
    setFilteredData(filteredDataMemo);
  }, [filteredDataMemo]);

  const handleExport = () => {
    setExporting(true);
    try {
      const formattedData = filteredData.map((row) => ({
        Immatriculation: row.F091IMMA,
        Marque: row.F090LIB,
        Document: row.F400NMDOC,
        "Montant HT": row.F410MTHT,
        "Code Produit": row.K410100PRO,
        Libellé: row.F410LIB,
        "Date Facture": row.F400FACDT,
        "Nom Client": row.F050NOM,
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Entretiens");
      XLSX.writeFile(
        wb,
        `entretiens_${matricule}_${new Date().toISOString().split("T")[0]}.xlsx`
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
          Recherche Entretiens - {matricule || "..."}
        </h2>
      </div>

      {loading2 ? <CardsLoader/> :
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Total Montant HT
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold tracking-tight">
                  {summary.totalMontant.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  DH
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
                  Nombre D'entretiens
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold tracking-tight">
                  {summary.totalEntretiens.toLocaleString("fr-FR")}
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
                  Montant Moyen
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold tracking-tight">
                  {summary.montantMoyen.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  DH
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
                  {summary.uniqueVehiclesCount.toLocaleString("fr-FR")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      }

      {loading2 ? <InputsLoader/> :
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <div className="w-full sm:w-64">
            <Label htmlFor="search">Matricule</Label>
            <div className="relative mt-1">
              <Search className="absolute top-2.5 left-2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Ex: 1234-ABC"
                className="pl-8"
              />
            </div>
          </div>
        
          <div className="w-full sm:w-64">
            <Label htmlFor="date-start">Date début</Label>
            <Input
              id="date-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        
          <div className="w-full sm:w-64">
            <Label htmlFor="date-end">Date fin</Label>
            <Input
              id="date-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleExport}
          className="flex items-center gap-2"
          disabled={exporting || filteredData.length === 0}
        >
          <FileDown className="w-4 h-4" />
          {exporting ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>
      }

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-50 border border-red-200 rounded">
          Erreur: {error}
        </div>
      )}

      {loading2 ? <TableLoader/> :
      <div className="h-[75vh]">
        <DataGrid
          rows={filteredData}
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
      }
    </div>
  );
}
