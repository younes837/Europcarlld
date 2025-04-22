"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown, Wrench, DollarSign, Car } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "../../components/Loaders/TableLoader";
import CardLoader from "../../components/Loaders/CardsLoader";
import CardsLoader from "../../components/Loaders/CardsLoader";
import InputsLoader from "../../components/Loaders/InputsLoader";
import * as XLSX from "xlsx";

const ClientDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nomClient, setNomClient] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [rowCount, setRowCount] = useState(0);
  const [summary, setSummary] = useState({
    totalMontant: 0,
    totalEntretiens: 0,
    montantMoyen: 0,
    uniqueVehiclesCount: 0,
  });

  useEffect(() => {
    const body = document.body;
    if (body) {
      body.removeAttribute("cz-shortcut-listen");
    }
  }, []);

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/all_entretien`;

  const fetchData = async () => {
    setLoading2(false);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });

      if (nomClient) params.append("nom_client", nomClient);
      if (startDate) params.append("date_debut", startDate);
      if (endDate) params.append("date_fin", endDate);

      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Network reponse was not ok");
      }
      const jsonData = await response.json();
      setData(jsonData.items);
      setRowCount(jsonData.total);
      setSummary(jsonData.summary);
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Échec de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, nomClient, startDate, endDate]);

  const columns = [
    { field: "F091IMMA", headerName: "Immatriculation", width: 150 },
    { field: "F090LIB", headerName: "Marque", width: 350 },
    { field: "F400NMDOC", headerName: "N° Document", width: 150 },
    { field: "F410MTHT", headerName: "Montant HT", width: 150 },
    { field: "K410100PRO", headerName: "Code Produit", width: 200 },
    { field: "F410LIB", headerName: "Libellé", width: 200 },
    { field: "F400FACDT", headerName: "Date", width: 150 },
    { field: "F050NOM", headerName: "Nom Client", width: 200 },
  ];

  // Fonction d'export Excel
  const exportToExcel = async () => {
    try {
      setExportLoading(true);

      const exportData = data.map((row) => ({
        Immatriculation: row.F091IMMA,
        Marque: row.F090LIB,
        "N° Document": row.F400NMDOC,
        "Montant HT": row.F410MTHT,
        "Code Produit": row.K410100PRO,
        Libellé: row.F410LIB,
        Date: row.F400FACDT,
        "Nom Client": row.F050NOM,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Entretiens Client");

      XLSX.writeFile(
        wb,
        `entretiens_client_${new Date().toISOString().split("T")[0]}.xlsx`
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
        Entretiens Client
      </h2>
      {loading2 ? (
        <CardsLoader />
      ) : (
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
                  <div className="text-sm font-medium text-muted-foreground">DH</div>
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
                  <div className="text-sm font-medium text-muted-foreground">DH</div>
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
                  onChange={(e) => setNomClient(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-64">
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
      )}
      {loading2 ? (
        <Loader />
      ) : (
        <div style={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={data}
            columns={columns}
            rowCount={rowCount}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            paginationModel={paginationModel}
            paginationMode="server"
            onPaginationModelChange={setPaginationModel}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            className="bg-white"
          />
        </div>
      )}
    </div>
  );
};

export default ClientDataTable;
