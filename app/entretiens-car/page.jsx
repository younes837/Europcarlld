"use client";

import { useState, useEffect, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileDown, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

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

export default function EntretienMatricule() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [matricule, setMatricule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    if (!matricule.trim()) {
      setError("Veuillez entrer un matricule.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const params = new URLSearchParams({
        search: matricule,
        ...(startDate && { dateDebut: startDate }),
        ...(endDate && { dateFin: endDate }),
        page: 1,
        pageSize: 1000
      });
  
      const response = await fetch(`http://localhost:3000/api/entretien_matricule?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      setData(jsonData.items);
      setFilteredData(jsonData.items);
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Échec de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = useCallback(() => {
    if (!startDate || !endDate) {
      setFilteredData(data);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError("La date de début doit être antérieure à la date de fin.");
      return;
    }

    const filtered = data.filter((row) => {
      const date = new Date(row.F400FACDT);
      return date >= start && date <= end;
    });

    setFilteredData(filtered);
  }, [startDate, endDate, data]);

  useEffect(() => {
    applyDateFilter();
  }, [startDate, endDate, data, applyDateFilter]);

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
      XLSX.writeFile(wb, `entretiens_${matricule}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Erreur export Excel :", error);
    } finally {
      setExporting(false);
    }
  };

  const totalEntretien = filteredData.length;
  const uniqueVehiclesCount = new Set(filteredData.map((item) => item.F091IMMA)).size;
  const totalMontant = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.F410MTHT || 0),
    0
  );

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
          Recherche Entretiens - {matricule || "..." }
        </h2>
        <Button
          onClick={handleExport}
          className="flex items-center gap-2"
          disabled={exporting || filteredData.length === 0}
        >
          <FileDown className="w-4 h-4" />
          {exporting ? "Exportation..." : "Exporter Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-blue-600 mb-2">Total Montant HT</p>
              <div className="text-2xl font-bold text-blue-900 truncate">
                {totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-green-600 mb-2">Nombre D'entretiens</p>
              <div className="text-2xl font-bold text-green-900 truncate">
                {totalEntretien.toLocaleString('fr-FR')}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-purple-600 mb-2">Montant Moyen</p>
              <div className="text-2xl font-bold text-purple-900 truncate">
                {(totalMontant / (totalEntretien || 1)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-orange-600 mb-2">Véhicules Uniques</p>
              <div className="text-2xl font-bold text-orange-900 truncate">
                {uniqueVehiclesCount.toLocaleString('fr-FR')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
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

        <div className="flex items-end">
          <Button onClick={fetchData} className="h-10">Rechercher</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-50 border border-red-200 rounded">
          Erreur: {error}
        </div>
      )}

      {loading && <div className="loader2"></div>}
      <div className="h-[75vh]">
        <DataGrid
          rows={filteredData.map((row, index) => ({ id: index, ...row }))}
          columns={columns}
          pageSizeOptions={[10, 20, 50]}
          pagination
          loading={loading}
          className="bg-white"
        />
      </div>
    </div>
  );
}
