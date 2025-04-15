"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "./TableLoader";
import CardLoader from "./CardsLoader";
import CardsLoader from "./CardsLoader";
import InputsLoader from "./InputsLoader";

const ClientDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(true);
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
    uniqueVehiclesCount: 0
  });

  useEffect(() => {
    const body = document.body;
    if (body) {
      body.removeAttribute('cz-shortcut-listen');
    }
  }, []);

  const API_URL = "http://localhost:3001/api/all_entretien";

  const fetchData = async () => {
    setLoading2(false);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });

      if (nomClient) params.append('nom_client', nomClient);
      if (startDate) params.append('date_debut', startDate);
      if (endDate) params.append('date_fin', endDate);

      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
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

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Entretiens Client
      </h2>
      {loading2 ? <CardsLoader/> : 
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-blue-600 mb-2">Montant Total HT</p>
              <div title={summary.totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} className="text-2xl font-bold text-blue-900 truncate">
                {summary.totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-green-600 mb-2">Nombre D'entretiens</p>
              <div title={summary.totalEntretiens.toLocaleString('fr-FR')} className="text-2xl font-bold text-green-900 truncate">
                {summary.totalEntretiens.toLocaleString('fr-FR')}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-purple-600 mb-2">Montant Moyen</p>
              <div title={summary.montantMoyen.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} className="text-2xl font-bold text-purple-900 truncate">
                {summary.montantMoyen.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-orange-600 mb-2">Véhicules Uniques</p>
              <div title={summary.uniqueVehiclesCount.toLocaleString('fr-FR')} className="text-2xl font-bold text-orange-900 truncate">
                {summary.uniqueVehiclesCount.toLocaleString('fr-FR')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      }

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-50 border border-red-200 rounded">
          Erreur: {error}
        </div>
      )}
      {loading2 ? <InputsLoader/> : 
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
      </div>
      }
      {loading2 ? <Loader/> :
      <div style={{ height: 600, width: '100%' }}>
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
      }
    </div>
  );
};

export default ClientDataTable;

